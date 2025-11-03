import { GoogleGenAI, Type } from "@google/genai";
import type { GraphData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        nodes: {
            type: Type.ARRAY,
            description: "An array of keyword nodes.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: {
                        type: Type.STRING,
                        description: "The keyword text."
                    },
                    weight: {
                        type: Type.NUMBER,
                        description: "Importance of the node, from 1 to 20."
                    },
                    group: {
                        type: Type.NUMBER,
                        description: "A numeric identifier for the thematic cluster (1-5)."
                    }
                },
                 required: ["id", "weight", "group"]
            }
        },
        links: {
            type: Type.ARRAY,
            description: "An array of links connecting the nodes.",
            items: {
                type: Type.OBJECT,
                properties: {
                    source: {
                        type: Type.STRING,
                        description: "The ID of the source node."
                    },
                    target: {
                        type: Type.STRING,
                        description: "The ID of the target node."
                    },
                    type: {
                        type: Type.STRING,
                        description: "Must be 'explicit' for user-defined links, and 'generated' for AI-created links."
                    },
                    label: {
                        type: Type.STRING,
                        description: "A concise, single-word verb in lowercase for the relationship, e.g., 'influences', 'supports', 'related', 'conflicts'."
                    },
                    strength: {
                        type: Type.NUMBER,
                        description: "Confidence score of the link, from 0.1 (weak) to 1.0 (strong)."
                    }
                },
                 required: ["source", "target", "type", "label", "strength"]
            }
        }
    },
    required: ["nodes", "links"]
};


export const generateGraphData = async (
  keywordsA: string,
  keywordsB: string,
  explicitLinks: string
): Promise<GraphData> => {
  const prompt = `
    You are an AI expert specializing in creating knowledge graphs to analyze shared values, interests, and collaboration potential between two entities.

    Your task is to analyze two sets of weighted keywords (System A, System B) and explicit connections. Generate a knowledge graph representing their concepts and relationships.

    **Instructions:**

    1.  **Incorporate All Inputs:** All keywords from System A, System B, and all explicit links must be in the graph.
    2.  **Grouping:**
        *   System A keywords: \`group: 1\`.
        *   System B keywords: \`group: 2\`.
        *   "Bridge" keywords connecting A & B: \`group: 3\`. These show collaboration potential.
        *   Use \`group: 4\` and \`group: 5\` for other thematic clusters.
    3.  **Expansion:** Generate new, semantically related keywords to enrich the graph.
    4.  **Weighting:** Assign a \`weight\` (integer 1-20) to every node, reflecting its importance. User weights are hints.
    5.  **Linking:**
        *   For each link, define its relationship with a \`label\`. The label must be a single, concise, lowercase verb (e.g., 'influences', 'supports', 'related').
        *   Assign a \`strength\` to each link (a number from 0.1 for weak to 1.0 for strong).
        *   User-defined "Explicit Links" **MUST** have \`type: "explicit"\`, \`label: "connects"\`, and \`strength: 1.0\`.
        *   All other AI-created links **MUST** have \`type: "generated"\`.

    **Inputs:**

    *   **System A Keywords:** "${keywordsA}"
    *   **System B Keywords:** "${keywordsB}"
    *   **Explicit Links (source-target):** "${explicitLinks}"

    **Output:**

    Your output must be a single, valid JSON object conforming to the provided schema. Do not include any text, code blocks, or explanations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.5,
      },
    });
    
    const jsonString = response.text.trim();
    const parsedData: GraphData = JSON.parse(jsonString);

    if (!parsedData.nodes || !parsedData.links) {
        throw new Error("Invalid data structure received from API.");
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate graph data from Gemini API.");
  }
};

export const generateLinkSuggestions = async (
  keywordsA: string,
  keywordsB: string
): Promise<string> => {
  const prompt = `
    You are an expert strategic analyst and deal maker. Your task is to identify the most valuable and impactful connections between two sets of keywords representing two different systems or entities (System A and System B).

    Analyze the keywords and identify pairs that represent significant opportunities for collaboration, synergy, or strategic partnership. Think about which connections would create the most value if explicitly made.

    **Instructions:**
    1.  Identify the top 3-5 most potent keyword pairs that link System A and System B.
    2.  Format your output as a single, comma-separated string of these pairs.
    3.  Each pair should be in the format \`keywordA-keywordB\`.
    4.  Do not include any explanations, introductory text, or any characters other than the comma-separated list.

    **Example Output:**
    design-startup,product-market-fit,collaboration-business

    **Inputs:**

    *   **System A Keywords:** "${keywordsA}"
    *   **System B Keywords:** "${keywordsB}"

    **Output:**
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    // Clean up the response to ensure it's a clean, comma-separated string.
    return response.text.trim().replace(/\n/g, '').replace(/,\s+/g, ',');
  } catch (error) {
    console.error("Error calling Gemini API for link suggestions:", error);
    throw new Error("Failed to generate link suggestions.");
  }
};

export const analyzeDocument = async (documentText: string): Promise<string> => {
    const prompt = `
    You are an AI expert in text analysis and knowledge extraction. Your task is to analyze the following document and extract the top 15-20 most important and relevant keywords and concepts.

    **Instructions:**
    1.  Read the entire document text carefully.
    2.  Identify the key themes, topics, and entities.
    3.  Assign a weight to each identified keyword/concept on a scale of 1 to 10, where 10 is the most important or central to the document.
    4.  Format your output as a single, comma-separated string.
    5.  Each item in the string must be in the format \`keyword:weight\`.
    6.  Ensure the output is clean and contains only the comma-separated list, with no introductory text, explanations, or code block formatting.

    **Example Output:**
    artificial-intelligence:10, machine-learning:9, data-analysis:8, strategic-planning:7

    **Document Text:**
    ---
    ${documentText}
    ---

    **Output:**
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    return response.text.trim().replace(/\n/g, '').replace(/,\s+/g, ',');
  } catch (error) {
    console.error("Error calling Gemini API for document analysis:", error);
    throw new Error("Failed to analyze document and extract keywords.");
  }
};
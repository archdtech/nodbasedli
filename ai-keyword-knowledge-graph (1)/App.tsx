import React, { useState, useCallback, useMemo } from 'react';
import { KeywordInput } from './components/KeywordInput';
import { Graph } from './components/Graph';
import { Loader } from './components/Loader';
import { FilterControls } from './components/FilterControls';
import { generateGraphData, analyzeDocument } from './services/geminiService';
import type { Node, Link } from './types';

export type DisplayMode = 'overlay' | 'systemA' | 'systemB' | 'intersection' | 'union';

export interface Filters {
  showExplicit: boolean;
  showGenerated: boolean;
}

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [commonNodes, setCommonNodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<{ A: boolean, B: boolean }>({ A: false, B: false });
  const [error, setError] = useState<string | null>(null);
  
  const [keywordsA, setKeywordsA] = useState('design:10, product:9, management:9, experience:7, user:7, team:5, collaboration:4, creative:6, visual:5');
  const [keywordsB, setKeywordsB] = useState('business:8, brand:7, university:6, startup:6, architect:5, solution:5, digital:5, blockchain:3, financial:3');

  const [filters, setFilters] = useState<Filters>({
    showExplicit: true,
    showGenerated: true,
  });
  const [displayMode, setDisplayMode] = useState<DisplayMode>('overlay');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [weightThreshold, setWeightThreshold] = useState<number>(0);


  const parseKeywords = (keywordsStr: string): string[] => {
    if (!keywordsStr) return [];
    return keywordsStr
      .split(',')
      .map(kw => kw.split(':')[0].trim())
      .filter(Boolean);
  };
  
  const handleAnalyzeDocument = useCallback(async (file: File, system: 'A' | 'B') => {
    if (!file) return;

    if (!['text/plain', 'text/markdown', 'application/pdf'].includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Please upload a .txt, .md, or .pdf file.`);
      return;
    }
    
    setIsAnalyzing(prev => ({ ...prev, [system]: true }));
    setError(null);
    try {
        let textContent = '';
        if (file.type === 'application/pdf') {
            const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
            const doc = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const text = await page.getTextContent();
                textContent += text.items.map((s: any) => s.str).join(' ');
            }
        } else {
             textContent = await file.text();
        }

        const MAX_LENGTH = 15000;
        const truncatedContent = textContent.substring(0, MAX_LENGTH);

        const analyzedKeywords = await analyzeDocument(truncatedContent);
        if (system === 'A') {
            setKeywordsA(analyzedKeywords);
        } else {
            setKeywordsB(analyzedKeywords);
        }

    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to analyze document.');
    } finally {
        setIsAnalyzing(prev => ({ ...prev, [system]: false }));
    }
  }, []);


  const handleGenerateGraph = useCallback(async (currentKeywordsA: string, currentKeywordsB: string, explicitLinks: string) => {
    setIsLoading(true);
    setError(null);
    setDisplayMode('overlay');
    setSelectedNodeId(null);

    const kwsA = parseKeywords(currentKeywordsA);
    const kwsB = parseKeywords(currentKeywordsB);
    const intersection = kwsA.filter(kw => kwsB.includes(kw));
    setCommonNodes(intersection);

    try {
      const graphData = await generateGraphData(currentKeywordsA, currentKeywordsB, explicitLinks);
      if (graphData && graphData.nodes && graphData.links) {
        setNodes(graphData.nodes);
        setLinks(graphData.links);
      } else {
        setError('Failed to generate graph. The API returned an unexpected format.');
        setNodes([]);
        setLinks([]);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setNodes([]);
      setLinks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNodeClick = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const displayedData = useMemo(() => {
    let visibleNodes: Node[] = [];
    let visibleLinks: Link[] = [];

    // FIX: Explicitly typing `nodeMap` prevents a type inference error when `nodes` is an empty array.
    const nodeMap: Map<string, Node> = new Map(nodes.map(n => [n.id, n]));

    switch (displayMode) {
      case 'systemA':
        visibleNodes = nodes.filter(n => n.group === 1);
        break;
      case 'systemB':
        visibleNodes = nodes.filter(n => n.group === 2);
        break;
      case 'intersection':
        visibleNodes = nodes.filter(n => commonNodes.includes(n.id));
        break;
      case 'union':
        visibleNodes = Array.from(nodeMap.values());
        break;
      case 'overlay':
      default:
        visibleNodes = nodes;
        break;
    }
    
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

    if (displayMode === 'union') {
        visibleLinks = links;
    } else {
        visibleLinks = links.filter(l => 
            visibleNodeIds.has(l.source as string) && visibleNodeIds.has(l.target as string)
        );
    }

    return { nodes: visibleNodes, links: visibleLinks };
  }, [displayMode, nodes, links, commonNodes]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <header className="p-4 sm:p-6 shadow-lg bg-gray-900/80 backdrop-blur-sm z-10 sticky top-0 border-b border-gray-700">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between sm:items-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-teal-400 to-pink-500">
            AI Knowledge Graph
          </h1>
           <p className="text-sm text-gray-400 mt-1 sm:mt-0">Identify values and interests between two systems</p>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 flex flex-col">
        <div className="w-full">
            <KeywordInput
                onGenerate={handleGenerateGraph}
                onAnalyzeDocument={handleAnalyzeDocument}
                isLoading={isLoading}
                isAnalyzing={isAnalyzing}
                keywordsA={keywordsA}
                setKeywordsA={setKeywordsA}
                keywordsB={keywordsB}
                setKeywordsB={setKeywordsB}
            />
        </div>

        {error && (
          <div className="my-4 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <FilterControls 
            filters={filters}
            setFilters={setFilters}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            hasSharedNodes={commonNodes.length > 0}
            disabled={nodes.length === 0 || isLoading}
            weightThreshold={weightThreshold}
            setWeightThreshold={setWeightThreshold}
        />
        
        <div className="flex-grow w-full min-h-[60vh] sm:min-h-[70vh] bg-gray-800/50 rounded-lg shadow-2xl mt-4 border border-gray-700 relative overflow-hidden">
          {isLoading ? (
            <Loader />
          ) : (
            <Graph 
              nodes={displayedData.nodes} 
              links={displayedData.links} 
              commonNodes={commonNodes}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNodeId}
              filters={filters}
              weightThreshold={weightThreshold}
            />
          )}
           {!isLoading && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-500">
                <p className="text-2xl font-semibold">Graph will appear here</p>
                <p className="mt-2">Enter keywords for two systems and click 'Generate' to start.</p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Built by a world-class senior frontend engineer.</p>
      </footer>
    </div>
  );
};

export default App;

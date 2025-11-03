# AI Knowledge Graph

A sophisticated React/Vite application that creates visual knowledge graphs using Google Gemini AI to analyze relationships between keywords from two different systems.

## 🌟 Features

- **Interactive Knowledge Graphs** - Visual relationships between concepts
- **Document Analysis** - Upload .txt, .md, or .pdf files for automatic keyword extraction
- **Multiple Display Modes** - Overlay, System A, System B, Intersection, Union
- **Advanced Filtering** - Control what connections are visible
- **AI-Powered Insights** - Using Google Gemini API for intelligent analysis

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Google Gemini API Key

### Setup

1. **Install dependencies:**
   ```bash
   cd app
   npm install
   ```

2. **Configure API Key:**
   ```bash
   cp .env.local.example .env.local
   ```
   Add your Gemini API key to `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
├── app/                    # AI Knowledge Graph application
│   ├── components/         # React components
│   ├── services/          # API services (Gemini integration)
│   ├── App.tsx            # Main application component
│   ├── vite.config.ts     # Vite configuration
│   └── package.json       # Dependencies
├── archive/               # Archived files (old Next.js project)
│   └── nextjs-project/    # Previous project files
└── README.md             # This file
```

## 🎯 How to Use

1. **Enter Keywords**: Input keywords for two different systems/concepts
2. **Generate Graph**: Click "Generate" to create the knowledge graph
3. **Upload Documents**: Optionally upload documents for automatic keyword extraction
4. **Explore Relationships**: Use filters and display modes to analyze connections
5. **Identify Insights**: Discover shared values and collaboration opportunities

## 🔧 Configuration

- **Port**: The app runs on port 3000 by default
- **API**: Uses Google Gemini 2.5 Flash model
- **Environment**: Configure via `.env.local` file

## 📊 Display Modes

- **Overlay**: Show all nodes and connections
- **System A**: Only show System A keywords
- **System B**: Only show System B keywords  
- **Intersection**: Show shared keywords only
- **Union**: Show all unique keywords

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Tech Stack
- **Frontend**: React 19.2.0
- **Build Tool**: Vite 6.2.0
- **Language**: TypeScript 5.8.2
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS

## 📝 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Built with ❤️ using AI and modern web technologies**
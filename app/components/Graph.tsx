import React, { useRef, useEffect } from 'react';
import type { Node, Link } from '../types';
import type { Filters } from '../App';

declare const d3: any;

interface GraphProps {
  nodes: Node[];
  links: Link[];
  commonNodes: string[];
  onNodeClick: (nodeId: string | null) => void;
  selectedNodeId: string | null;
  filters: Filters;
  weightThreshold: number;
}

export const Graph: React.FC<GraphProps> = ({ nodes, links, commonNodes, onNodeClick, selectedNodeId, filters, weightThreshold }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<any>();
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const container = svg.node().parentElement;

    if (!nodes.length) {
        svg.selectAll("*").remove();
        return;
    }
    
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const simulation = simulationRef.current || d3.forceSimulation()
      .force("link", d3.forceLink().id((d: any) => d.id).distance(100).strength(0.1))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.weight * 2.5 + 8));

    simulationRef.current = simulation;
    
    svg.selectAll('.main-group').remove();
    const mainGroup = svg.append("g").attr('class', 'main-group');

    const color = d3.scaleOrdinal([ '#ec4899', '#14b8a6', '#a3e635', '#f97316', '#38bdf8' ]);
    
    simulation.nodes(nodes);
    simulation.force("link").links(links);

    const link = mainGroup.append("g").selectAll("path")
      .data(links, (d:any) => `${d.source.id}-${d.target.id}`)
      .join("path")
      .attr("id", (d: any) => `link-${d.source.id}-${d.target.id}`)
      .attr("stroke", (d: Link) => d.type === 'explicit' ? '#a3e635' : '#999')
      .attr("stroke-width", (d: Link) => 1 + d.strength * 2.5);

    const linkLabel = mainGroup.append("g").selectAll("text")
        .data(links)
        .join("text")
        .attr("dy", -4)
        .append("textPath")
        .attr("xlink:href", (d: any) => `#link-${d.source.id}-${d.target.id}`)
        .style("text-anchor", "middle")
        .attr("startOffset", "50%")
        .text((d: Link) => d.label)
        .style('font-size', '8px')
        .style('fill', '#d1d5db');

    const node = mainGroup.append("g").selectAll("g")
      .data(nodes, (d:any) => d.id)
      .join("g")
      .call(drag(simulation))
      .on('click', (event: any, d: Node) => {
        event.stopPropagation();
        onNodeClick(selectedNodeId === d.id ? null : d.id);
      })
      .on('mouseover', (event: MouseEvent, d: Node) => {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = `${event.pageX + 15}px`;
          tooltipRef.current.style.top = `${event.pageY + 15}px`;
          tooltipRef.current.innerHTML = `<strong>${d.id}</strong><br/>Weight: ${d.weight}<br/>Group: ${d.group}`;
        }
      })
      .on('mouseout', () => {
         if (tooltipRef.current) {
            tooltipRef.current.style.display = 'none';
         }
      })
      .style('cursor', 'pointer');

    node.append("circle")
        .attr("r", (d: Node) => d.weight * 2.5)
        .attr("fill", (d: Node) => color(d.group.toString()));
    
    const starPath = "M0,-4 L1.17,-1.24 3.8,-1.24 1.81,0.47 2.35,3.24 0,1.5 -2.35,3.24 -1.81,0.47 -3.8,-1.24 -1.17,-1.24 Z";
    node.filter((d: Node) => commonNodes.includes(d.id))
      .append('path')
      .attr('d', starPath)
      .attr('fill', '#facc15')
      .attr('stroke', '#111827')
      .attr('stroke-width', 0.5)
      .attr('transform', (d: Node) => `translate(0, -${d.weight * 2.5 + 6}) scale(0.9)`);

    node.append("text")
        .text((d: Node) => d.id)
        .attr('x', 0)
        .attr('y', (d: Node) => d.weight * 2.5 + 15)
        .style('font-size', '12px')
        .style('font-weight', '500')
        .style('fill', '#e5e7eb')
        .style('paint-order', 'stroke')
        .style('stroke', '#111827')
        .style('stroke-width', '3px')
        .style('stroke-linecap', 'round')
        .style('stroke-linejoin', 'round')
        .style('pointer-events', 'none')
        .attr('text-anchor', 'middle');
        
    simulation.on("tick", () => {
      link.attr("d", (d:any) => `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    const zoomBehavior = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (event: any) => mainGroup.attr('transform', event.transform));
    svg.call(zoomBehavior);

    simulation.alpha(0.3).restart();
    
    // ===== Filtering/Highlighting Logic =====
    const visibleLinkTypes = new Set<string>();
    if (filters.showExplicit) visibleLinkTypes.add('explicit');
    if (filters.showGenerated) visibleLinkTypes.add('generated');

    const selectionAndNeighbors = new Set<string>(selectedNodeId ? [selectedNodeId] : []);
    if (selectedNodeId) {
        links.forEach(l => {
            // FIX: d3-force replaces string IDs with node objects. Access .id to get the string.
            const sourceId = typeof l.source === 'object' ? (l.source as Node).id : l.source;
            const targetId = typeof l.target === 'object' ? (l.target as Node).id : l.target;
            if(sourceId === selectedNodeId) selectionAndNeighbors.add(targetId);
            if(targetId === selectedNodeId) selectionAndNeighbors.add(sourceId);
        });
    }

    const isNodeVisible = (d: Node) => {
        const isAboveWeight = d.weight >= weightThreshold;
        const isSelectedOrNeighbor = selectedNodeId ? selectionAndNeighbors.has(d.id) : true;
        return isAboveWeight && isSelectedOrNeighbor;
    }
    
    const isLinkVisible = (d: any) => {
        const sourceVisible = isNodeVisible(d.source);
        const targetVisible = isNodeVisible(d.target);
        const typeVisible = visibleLinkTypes.has(d.type);
        return sourceVisible && targetVisible && typeVisible;
    }

    // Apply styles with transitions
    const t = svg.transition().duration(500);

    node.select("circle")
        .transition(t)
        .attr("stroke", (d: Node) => selectedNodeId === d.id ? '#facc15' : '#1f2937')
        .attr("stroke-width", (d: Node) => selectedNodeId === d.id ? 3 : 2);

    node.transition(t).style('opacity', (d: Node) => isNodeVisible(d) ? 1 : 0.1);

    link.transition(t).style('opacity', (d: any) => isLinkVisible(d) ? (d.strength * 0.7 + 0.2) : 0.05);
    
    linkLabel.transition(t).style('opacity', (d: any) => isLinkVisible(d) ? 1 : 0);

    return () => {
      simulation.stop();
    };
  }, [nodes, links, commonNodes, selectedNodeId, filters, weightThreshold]);

  function drag(simulation: any) {
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: any) { d.fx = event.x; d.fy = event.y; }
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
  }

  return (
    <>
      <div 
        ref={tooltipRef} 
        className="absolute z-20 p-2 text-sm bg-gray-900 border border-gray-600 rounded-md shadow-lg text-gray-200 pointer-events-none" 
        style={{display: 'none', transition: 'opacity 0.2s'}}
      ></div>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </>
  );
};

export interface Node {
  id: string;
  weight: number;
  group: number;
}

export interface Link {
  source: string;
  target: string;
  type: 'explicit' | 'generated';
  label: string;
  strength: number; // 0.1 to 1.0
}

export interface GraphData {
    nodes: Node[];
    links: Link[];
}
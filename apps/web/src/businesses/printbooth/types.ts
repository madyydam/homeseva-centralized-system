export interface PrintJobItem {
  id: string;
  jobTicket: string;
  clientName: string;
  jobType: 'Brochures & Catalogues' | 'Custom Packaging Boxes' | 'Vinyl Flex Banners' | 'Corporate Business Cards';
  paperGsm: string;
  copiesCount: number;
  totalInvoice: number;
  stage: 'Artwork Proofing' | 'Plates / Rip' | 'Printing on Press' | 'Post-Press & Binding' | 'Dispatched';
  targetDispatch: string;
}

export interface PaperStockItem {
  id: string;
  paperName: string;
  gsm: number;
  finish: 'Gloss Art Paper' | 'Matte Coated' | 'Kraft Board' | 'Textured Metallic';
  reamsInStock: number;
  minReams: number;
}

export interface PrintboothData {
  jobs: PrintJobItem[];
  paperStock: PaperStockItem[];
}


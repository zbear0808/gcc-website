export const shellFacets = [
  { key: 'brand', label: 'Brand', getValue: (s: any) => s.type === 'oem' ? 'Nintendo (OEM)' : 'Extremerate' },
  { key: 'color', label: 'Color/Style', getValue: (s: any) => s.label }
];

export const buttonFacets = [
  { key: 'brand', label: 'Brand', getValue: (b: any) => b.type === 'oem' ? 'Nintendo (OEM)' : 'Extremerate' },
  { key: 'color', label: 'Color', getValue: (b: any) => b.label.replace(' Buttons', '').replace(' Button', '') }
];

export const stickCapFacets = [
  {
    key: 'brand',
    label: 'Brand',
    getValue: (c: any) => {
      if (c.id.includes('extremerate')) return 'Extremerate';
      if (c.id.includes('jcd')) return 'JCD';
      if (c.id.includes('3rd-party')) return 'Other 3rd Party';
      return 'Nintendo (OEM)';
    }
  },
  {
    key: 'type',
    label: 'Type',
    getValue: (c: any) => {
      if (!c.id.startsWith('gc-cap') && !c.id.startsWith('wii-cap')) return null;
      if (c.id.includes('gc-cap')) return 'GameCube';
      if (c.id.includes('wii-cap')) return 'Wii';
      return null;
    }
  },
  {
    key: 'color',
    label: 'Color',
    getValue: (c: any) => {
      if (!c.id.startsWith('gc-cap') && !c.id.startsWith('wii-cap')) return null;
      if (c.id.includes('tpu')) return null;
      if (c.id.includes('black')) return 'Black';
      if (c.id.includes('wii-cap')) return 'White';
      if (c.id.includes('gc-cap')) return 'Grey';
      return null;
    }
  },
  {
    key: 'variant',
    label: 'Variant',
    getValue: (c: any) => {
      if (c.id.includes('tpu')) return 'TPU Top';
      if (c.id.includes('gc-cap')) return 'Standard';
      return null;
    }
  },
  {
    key: 'condition',
    label: 'Condition',
    getValue: (c: any) => {
      if (c.id.includes('good')) return 'Good';
      if (c.id.includes('okay')) return 'Okay';
      if (c.id.includes('poor')) return 'Poor';
      return null;
    }
  }
];

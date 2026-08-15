// Shared vehicle make/model/variant data for the "choose model manually" flow

export interface VehicleModel {
  name: string
  variants: string[]
}

export interface VehicleMake {
  name: string
  models: VehicleModel[]
}

export const vehicleMakes: VehicleMake[] = [
  {
    name: "Audi",
    models: [
      { name: "A1", variants: ["SE", "Sport", "S line", "Black Edition"] },
      { name: "A3", variants: ["SE Technik", "Sport", "S line", "S3", "RS3"] },
      { name: "A4", variants: ["Technik", "Sport", "S line", "S4", "RS4"] },
      { name: "Q3", variants: ["Technik", "Sport", "S line", "Vorsprung"] },
      { name: "Q5", variants: ["Sport", "S line", "Black Edition"] },
    ],
  },
  {
    name: "BMW",
    models: [
      { name: "1 Series", variants: ["SE", "Sport", "M Sport", "M135i"] },
      { name: "2 Series", variants: ["Sport", "M Sport", "M240i"] },
      { name: "3 Series", variants: ["SE", "Sport", "M Sport", "M340i", "M3"] },
      { name: "5 Series", variants: ["SE", "M Sport", "M550i", "M5"] },
      { name: "X1", variants: ["SE", "Sport", "xLine", "M Sport"] },
    ],
  },
  {
    name: "Ford",
    models: [
      { name: "Fiesta", variants: ["Zetec", "Titanium", "ST-Line", "ST"] },
      { name: "Focus", variants: ["Zetec", "Titanium", "ST-Line", "ST", "RS"] },
      { name: "Puma", variants: ["Titanium", "ST-Line", "ST"] },
      { name: "Kuga", variants: ["Zetec", "Titanium", "ST-Line", "Vignale"] },
    ],
  },
  {
    name: "Mercedes-Benz",
    models: [
      { name: "A-Class", variants: ["SE", "Sport", "AMG Line", "A35 AMG", "A45 AMG"] },
      { name: "C-Class", variants: ["SE", "Sport", "AMG Line", "C43 AMG", "C63 AMG"] },
      { name: "E-Class", variants: ["SE", "AMG Line", "E53 AMG"] },
      { name: "GLA", variants: ["SE", "Sport", "AMG Line"] },
    ],
  },
  {
    name: "Toyota",
    models: [
      { name: "Yaris", variants: ["Icon", "Design", "Excel", "GR"] },
      { name: "Corolla", variants: ["Icon", "Design", "Excel", "GR Sport"] },
      { name: "C-HR", variants: ["Icon", "Design", "Excel", "GR Sport"] },
      { name: "RAV4", variants: ["Icon", "Design", "Excel", "Dynamic"] },
    ],
  },
  {
    name: "Volkswagen",
    models: [
      { name: "Polo", variants: ["S", "Match", "R-Line", "GTI"] },
      { name: "Golf", variants: ["S", "Match", "R-Line", "GTI", "R"] },
      { name: "Passat", variants: ["SE", "R-Line", "GTE"] },
      { name: "Tiguan", variants: ["S", "Match", "R-Line", "R"] },
    ],
  },
  {
    name: "Vauxhall",
    models: [
      { name: "Corsa", variants: ["Design", "SRi", "Ultimate", "GS Line"] },
      { name: "Astra", variants: ["Design", "SRi", "Ultimate", "GS Line"] },
      { name: "Mokka", variants: ["Design", "SRi", "Ultimate", "GS Line"] },
    ],
  },
  {
    name: "Nissan",
    models: [
      { name: "Micra", variants: ["Visia", "Acenta", "N-Connecta", "Tekna"] },
      { name: "Juke", variants: ["Visia", "Acenta", "N-Connecta", "Tekna"] },
      { name: "Qashqai", variants: ["Visia", "Acenta", "N-Connecta", "Tekna"] },
    ],
  },
]

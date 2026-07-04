// Simplified from web's item-details-form constants: web's CategoryField is a
// full parent/child drill-down tree (10 parents x ~10 children each) with
// custom-category creation nested inside a search drawer. Ported here as a
// flat top-level list only (still lets sellers type a custom category) —
// keeps the picker to one level instead of porting the whole tree browser.
export const CATEGORIES = [
  { id: "tops", label: "Tops" },
  { id: "bottoms", label: "Bottoms" },
  { id: "dressesJumpsuits", label: "Dresses & Jumpsuits" },
  { id: "outerwear", label: "Outerwear" },
  { id: "footwear", label: "Footwear" },
  { id: "bags", label: "Bags" },
  { id: "accessories", label: "Accessories" },
  { id: "activewear", label: "Activewear" },
  { id: "swimwear", label: "Swimwear" },
  { id: "loungewearSleepwear", label: "Loungewear & Sleepwear" },
];

export const CONDITIONS = [
  { id: "nuevo", label: "New" },
  { id: "casi_nuevo", label: "Like new" },
  { id: "usado", label: "Used" },
  { id: "vintage", label: "Vintage" },
  { id: "detalles", label: "With flaws" },
];

export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "OS"];

export const PROMO_TYPES = [
  { id: "sale", label: "Sale" },
  { id: "black_friday", label: "Black Friday" },
  { id: "flash_sale", label: "Flash Sale" },
  { id: "clearance", label: "Clearance" },
];

const fs = require('fs');
const path = 'C:/Users/baghe/.openclaw/workspace/etsyseolab-6/types.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /export interface Product \{[\s\S]*?price\?: number;\s*\}/;

const newIface = `export interface Product {
  id: string;
  listing_id?: string;
  title: string;
  description: string;
  tags: string[];
  imageFilename: string;
  imageUrl: string;
  images?: any[];
  variants?: any[];
  seoScore: number;
  quantity?: number;
  price?: number;
}`;

if (regex.test(content)) {
    content = content.replace(regex, newIface);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully updated types.ts');
} else {
    console.log('regex not matched in types.ts');
}


export interface GoogleFont {
  name: string;
  family: string;
  weights?: string[]; // e.g., ['400', '700']
  styles?: string[]; // e.g., ['italic']
}

export const googleFonts: GoogleFont[] = [
  { name: 'Roboto', family: 'Roboto, sans-serif', weights: ['400', '700'], styles: ['italic'] },
  { name: 'Open Sans', family: '"Open Sans", sans-serif', weights: ['400', '700'], styles: ['italic'] },
  { name: 'Lato', family: 'Lato, sans-serif', weights: ['400', '700'], styles: ['italic'] },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', weights: ['400', '700'], styles: ['italic'] },
  { name: 'Oswald', family: 'Oswald, sans-serif', weights: ['400', '700'] },
  { name: 'Source Sans Pro', family: '"Source Sans Pro", sans-serif', weights: ['400', '700'], styles: ['italic'] },
  { name: 'Raleway', family: 'Raleway, sans-serif', weights: ['400', '700'], styles: ['italic'] },
  { name: 'PT Sans', family: '"PT Sans", sans-serif', weights: ['400', '700'], styles: ['italic'] },
  { name: 'Merriweather', family: 'Merriweather, serif', weights: ['400', '700'], styles: ['italic'] },
  { name: 'Playfair Display', family: '"Playfair Display", serif', weights: ['400', '700'], styles: ['italic'] },
  { name: 'Lobster', family: 'Lobster, cursive', weights: ['400'] },
  { name: 'Pacifico', family: 'Pacifico, cursive', weights: ['400'] },
  { name: 'Dancing Script', family: '"Dancing Script", cursive', weights: ['400', '700'] },
  { name: 'Arial', family: 'Arial, sans-serif' },
  { name: 'Verdana', family: 'Verdana, sans-serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Times New Roman', family: '"Times New Roman", Times, serif' },
  { name: 'Courier New', family: '"Courier New", Courier, monospace' },
];

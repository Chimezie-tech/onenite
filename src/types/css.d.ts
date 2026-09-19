/**
 * Tells TypeScript that `.css` side-effect imports are handled
 * by the Next.js bundler. Without this declaration, TS raises TS2882.
 */
declare module "*.css";
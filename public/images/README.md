Drop brand assets here (all referenced from lib/data.ts and the pages):

- logo.png            square brand logo (shown top-left in the nav + footer)
- og.jpg              1200x630 share-preview card (see reference/gotchas.md)
- hero-poster.jpg     poster frame for the hero video (or a hero still)
- story-poster.jpg    poster frame for the story video
- interior.jpg        optional still for the story block (if no story video)
- dish-1.jpg … dish-6.jpg   the six signature photos

Convert/resize with sips, e.g.:
  sips -s format jpeg -Z 1400 input.png --out dish-1.jpg

Optional background videos (portrait phone reels work great):

- hero.mp4    plays behind the hero headline
- story.mp4   plays in the "Story" block

Grab a clean poster frame from any video with:
  qlmanage -t -s 1280 -o . hero.mp4     # -> hero.mp4.png
  sips -s format jpeg -Z 1400 hero.mp4.png --out ../images/hero-poster.jpg

If you have no video, use an <img> in the hero/story instead (see page.tsx notes).

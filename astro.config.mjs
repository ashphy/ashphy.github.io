import { defineConfig } from "astro/config";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
import robotsTxt from 'astro-robots-txt';
import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
  site: 'https://ashphy.com',
  integrations: [
    partytown({
      config: {
        forward: ["dataLayer.push"]
      }
    }),
    sitemap(),
    robotsTxt(),
    compress({
      css: true,
      html: true,
      img: false,
      js: true,
      svg: false,
    })
  ],
  image: {
    responsiveStyles: true,
  }
});

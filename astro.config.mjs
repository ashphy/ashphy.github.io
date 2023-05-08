import { defineConfig } from "astro/config";
import partytown from "@astrojs/partytown";
import image from "@astrojs/image";
import sitemap from "@astrojs/sitemap";
import robotsTxt from 'astro-robots-txt';
import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
  site: 'https://ashphy.com',
  integrations: [
    image({
      serviceEntryPoint: '@astrojs/image/sharp'
    }),
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
  ]
});

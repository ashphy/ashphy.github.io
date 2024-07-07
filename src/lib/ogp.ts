import { JSDOM } from "jsdom";
import { z } from "zod";
import sizeOf from "image-size";

export type Ogp = {
  title: string;
  siteName: string;
  url: string;
  imageURL: string;
  width: number;
  height: number;
};

// https://oembed.com/
const OembedSchema = z.object({
  title: z.string(),
  author_name: z.string(),
  author_url: z.string(),
  provider_name: z.string(),
  provider_url: z.string(),
  type: z.string(),
  width: z.number(),
  height: z.number(),
  html: z.string(),
  thumbnail_url: z.string().optional(),
  thumbnail_width: z.number().optional(),
  thumbnail_height: z.number().optional(),
});

const extractOembed = async (dom: JSDOM): Promise<Partial<Ogp>> => {
  const oembed = dom.window.document.head.querySelectorAll(
    "link[type='application/json+oembed']"
  );

  if (oembed.length === 1) {
    const href = oembed[0].getAttribute("href");
    if (href) {
      const response = await fetch(href);
      if (response.ok) {
        const json = await response.json();
        const oembed = OembedSchema.parse(json);
        return {
          title: oembed.title,
          siteName: oembed.provider_name,
          url: oembed.provider_url,
          imageURL: oembed.thumbnail_url,
          width: oembed.thumbnail_width,
          height: oembed.thumbnail_height,
        };
      }
    }
  }

  return {};
};

const extractOgp = (dom: JSDOM): Partial<Ogp> => {
  const meta = dom.window.document.head.querySelectorAll("meta");
  const ogp = [...meta]
    .filter((element: Element) => element.hasAttribute("property"))
    .reduce<Record<string, string>>((previous, current) => {
      const property = current.getAttribute("property")?.trim();
      if (!property) return previous;
      const content = current.getAttribute("content");
      if (!content) return previous;
      previous[property] = content;
      return previous;
    }, {});

  return {
    title: ogp["og:title"],
    siteName: ogp["og:site_name"],
    url: ogp["og:url"],
    imageURL: ogp["og:image"],
    width: parseInt(ogp["og:image:width"]),
    height: parseInt(ogp["og:image:height"]),
  };
};

const extractImage = async (imageUrl: string) => {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Failed to fetch image");
  const buffer = await response.arrayBuffer();
  const imageSize = sizeOf(new Uint8Array(buffer));
  return imageSize;
};

const buildImageSize = async (
  imageURL: string | undefined,
  width: number | undefined,
  height: number | undefined
) => {
  if (imageURL === undefined) {
    return { width: 0, height: 0 };
  }

  if (width && height) {
    return { width, height };
  }

  const imageSize = await extractImage(imageURL);
  return {
    width: imageSize.width ?? 0,
    height: imageSize.height ?? 0,
  };
};

export const getOgp = async (url: string): Promise<Ogp> => {
  const dom = await JSDOM.fromURL(url);

  const oembed = await extractOembed(dom);
  const ogp = extractOgp(dom);
  const { width, height } = await buildImageSize(
    oembed.imageURL || ogp.imageURL,
    oembed.width || ogp.width,
    oembed.height || ogp.height
  );

  return {
    title: oembed.title || ogp.title || "",
    siteName: oembed.siteName || ogp.siteName || "",
    url: oembed.url || ogp.url || "",
    imageURL: oembed.imageURL || ogp.imageURL || "",
    width: width,
    height: height,
  };
};

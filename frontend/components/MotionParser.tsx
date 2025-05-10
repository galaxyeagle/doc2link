"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import parse, {
  DOMNode,
  Element,
  HTMLReactParserOptions,
} from "html-react-parser";

// Define Motion components with capitalized names
const MotionComponents = {
  MotionDiv: motion.div,
  MotionSection: motion.section,
  MotionArticle: motion.article,
  MotionHeader: motion.header,
  MotionP: motion.p,
  MotionSpan: motion.span,
};

export default function MotionParser({ html }: { html: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!html) return null;

  const options: HTMLReactParserOptions = {
    replace: (node: DOMNode) => {
      if (!(node instanceof Element)) return;

      // Convert motion.element to MotionElement format
      if (node.name?.startsWith("Motion") && node.name in MotionComponents) {
        if (!isMounted) return null;

        const Component =
          MotionComponents[node.name as keyof typeof MotionComponents];
        if (!Component) return null;

        const props: Record<string, any> = {};

        // Process attributes
        Object.entries(node.attribs || {}).forEach(([key, value]) => {
          try {
            if (
              [
                "initial",
                "animate",
                "exit",
                "transition",
                "variants",
                "whileHover",
                "whileTap",
              ].includes(key)
            ) {
              props[key] = JSON.parse(value);
            } else {
              props[key] = value;
            }
          } catch {
            props[key] = value;
          }
        });

        return React.createElement(
          Component,
          {
            ...props,
            key: props.id || `motion-${Math.random()}`,
          },
          ...(node.children || []).map((child) =>
            parse(child.toString(), options),
          ),
        );
      }
    },
  };

  return <AnimatePresence>{parse(html, options)}</AnimatePresence>;
}

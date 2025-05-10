declare module "html-react-parser" {
  import { ReactElement } from "react";

  export interface DOMNode {
    name?: string;
    type: string;
    attribs?: Record<string, string>;
    children?: DOMNode[];
    next?: DOMNode | null;
    prev?: DOMNode | null;
    parent?: DOMNode | null;
    toString(): string;
  }

  export interface Element extends DOMNode {
    name: string;
    attribs: Record<string, string>;
  }

  export interface HTMLReactParserOptions {
    replace?: (node: DOMNode) => ReactElement | void | null | undefined;
    library?: any;
  }

  function parse(
    html: string,
    options?: HTMLReactParserOptions,
  ): ReactElement | ReactElement[];
  export default parse;
}

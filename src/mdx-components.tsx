import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    a: (props) => {
      const isExternal =
        props.href?.startsWith("http") &&
        !props.href.includes("alepouroullis.com");
      return (
        <a
          {...props}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          style={{
            fontSize: "inherit",
            ...props.style,
          }}
        />
      );
    },
  };
}

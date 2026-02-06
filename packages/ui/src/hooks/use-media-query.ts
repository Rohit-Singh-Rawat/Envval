import * as React from "react"

/**
 * Hook that returns whether a media query matches.
 * Returns undefined during SSR, then actual value after hydration.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    setMatches(mql.matches)
    mql.addEventListener("change", onChange)

    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return !!matches
}

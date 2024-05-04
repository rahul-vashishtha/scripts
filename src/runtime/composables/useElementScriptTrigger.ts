import type {
  MaybeComputedElementRef,
  MaybeElement,
  UseIntersectionObserverReturn,
} from '@vueuse/core'
import {
  useEventListener,
  useIntersectionObserver,
} from '@vueuse/core'

export type ElementScriptTrigger = 'visible' | keyof GlobalEventHandlersEventMap | false

export interface ElementScriptTriggerOptions {
  /**
   * The event to trigger the script load.
   */
  trigger?: ElementScriptTrigger | undefined
  /**
   * The element to watch for the trigger event.
   * @default document.body
   */
  el?: MaybeComputedElementRef<MaybeElement>
}

function useElementVisibilityPromise(element: MaybeComputedElementRef) {
  let observer: UseIntersectionObserverReturn
  return new Promise<void>((resolve) => {
    observer = useIntersectionObserver(
      element,
      (intersectionObserverEntries) => {
        // Get the latest value of isIntersecting based on the entry time
        for (const entry of intersectionObserverEntries) {
          if (entry.isIntersecting)
            resolve()
        }
      },
      {
        rootMargin: '30px 0 0 0',
        threshold: 0,
      },
    )
  }).finally(() => {
    observer.stop()
  })
}

/**
 * Create a trigger for an element to load a script based on specific element events.
 */
export function useElementScriptTrigger(options: ElementScriptTriggerOptions): Promise<void> {
  const { el, trigger } = options
  if (import.meta.server || !el)
    return new Promise<void>(() => {})
  if (el && options.trigger === 'visible')
    return useElementVisibilityPromise(el)
  if (trigger) {
    // TODO optimize this, only have 1 instance of intersection observer, stop on find
    return new Promise<void>((resolve) => {
      const _ = useEventListener(
        typeof el !== 'undefined' ? (el as EventTarget) : document.body,
        trigger,
        () => {
          resolve()
          _()
        },
        { once: true, passive: true },
      )
    })
  }
  return Promise.resolve()
}

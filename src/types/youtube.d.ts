declare global {
  interface Window {
    YT: {
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
      Player: new (element: HTMLElement, config: any) => any;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export {};

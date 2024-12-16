// src/lucide-react.d.ts

declare module 'lucide-react' {
    import { FC, SVGProps } from 'react';
  
    export interface IconProps extends SVGProps<SVGSVGElement> {
      size?: string | number;
      color?: string;
      stroke?: string | number;
    }
  
    export type Icon = FC<IconProps>;
  
    export const MessageCircle: Icon;
    export const X: Icon;
    // Add other icon names you're using from lucide-react
  }
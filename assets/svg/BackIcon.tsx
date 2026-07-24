import React from 'react';
import { SvgXml } from 'react-native-svg';

const icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19 12H5" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 19L5 12L12 5" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const BackIcon = ({ color, size }: { color: string; size: number }) => (
    <SvgXml
        xml={icon.replace(/{color}/g, color)}
        width={size}
        height={size}
    />
);
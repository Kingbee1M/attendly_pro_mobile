import React from 'react';
import { SvgXml } from 'react-native-svg';

const icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="{color}"/>
<path d="M12 14C7.58172 14 4 17.5817 4 22C4 22.5523 4.44772 23 5 23H19C19.5523 23 20 22.5523 20 22C20 17.5817 16.4183 14 12 14Z" fill="{color}"/>
</svg>`;

export const ProfileIcon = ({ color, size }: { color: string; size: number }) => (
    <SvgXml
        xml={icon.replace(/{color}/g, color)} // Uses global regex replacement to catch both paths
        width={size}
        height={size}
    />
);
import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Text as SvgText } from 'react-native-svg';
import { colors, MOODS } from './theme';

export type Face = number | 'sleep'; // 0〜4=表情, 'sleep'=眠っている顔

const INK = colors.ink;

// 目・口・おまけ(汗やもやもやマーク)。diary-home.html の face() を移したもの
function Parts({ face }: { face: Face }) {
  const stroke = { stroke: INK, fill: 'none', strokeLinecap: 'round' as const };
  switch (face) {
    case 'sleep':
      return (
        <>
          <Path d="M76 108q10 9 20 0M124 108q10 9 20 0" strokeWidth={5} {...stroke} />
          <Path d="M102 126q8 6 16 0" strokeWidth={4.5} {...stroke} />
          <SvgText x={160} y={62} fontSize={20} fill={colors.moon} fontWeight="700">z</SvgText>
          <SvgText x={176} y={42} fontSize={15} fill={colors.moon} fontWeight="700">z</SvgText>
        </>
      );
    case 0:
      return (
        <>
          <Path d="M76 106q10-12 20 0M124 106q10-12 20 0" strokeWidth={5} {...stroke} />
          <Path d="M96 122q14 18 28 0z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        </>
      );
    case 1:
      return (
        <>
          <Circle cx={86} cy={108} r={5.5} fill={INK} />
          <Circle cx={134} cy={108} r={5.5} fill={INK} />
          <Path d="M101 126q9 6 18 0" strokeWidth={4.5} {...stroke} />
        </>
      );
    case 2:
      return (
        <>
          <Path d="M76 110h20M124 110h20" strokeWidth={5} {...stroke} />
          <Path d="M80 120q6 4 12 0M128 120q6 4 12 0" strokeWidth={3} {...stroke} stroke={colors.sub} />
          <Ellipse cx={110} cy={130} rx={6} ry={4.5} fill={INK} />
        </>
      );
    case 3:
      return (
        <>
          <Circle cx={86} cy={110} r={6.5} fill={INK} />
          <Circle cx={134} cy={110} r={6.5} fill={INK} />
          <Circle cx={83.5} cy={107.5} r={2.2} fill="#fff" />
          <Circle cx={131.5} cy={107.5} r={2.2} fill="#fff" />
          <Path d="M76 91q8 0 16-8M144 91q-8 0-16-8" strokeWidth={3.5} {...stroke} />
          <Path d="M102 135q8-7 16 0" strokeWidth={4.5} {...stroke} />
          <Path d="M86 120q-5 9 0 12q5-3 0-12z" fill="#8FB8F0" />
        </>
      );
    default:
      return (
        <>
          <Circle cx={86} cy={108} r={5.5} fill={INK} />
          <Circle cx={134} cy={108} r={5.5} fill={INK} />
          <Path d="M96 128q5-6 10 0t10 0t10 0" strokeWidth={4.5} {...stroke} />
          <Path d="M150 50q14-4 14 8q0 10-10 8q-6-2-3-8" strokeWidth={3.5} {...stroke} stroke={colors.sub} />
        </>
      );
  }
}

type Props = { face: Face; color?: string; size?: number | string };

export default function Character({ face, color = colors.body, size = '100%' }: Props) {
  const blush = face === 0 || face === 'sleep';
  const label = face === 'sleep' ? '眠るキャラクター' : MOODS[face];
  return (
    <Svg viewBox="0 0 220 220" width={size} height={size} accessibilityLabel={label}>
      <Ellipse cx={110} cy={196} rx={58} ry={8} fill="#000" opacity={0.18} />
      <Path d="M110 36c-44 0-74 26-74 70 0 32 22 58 74 58s74-26 74-58c0-44-30-70-74-70z" fill={color} />
      <Path d="M62 52q-8-18 6-24q6 12 4 26zM158 52q8-18-6-24q-6 12-4 26z" fill={color} />
      {blush && (
        <G opacity={0.6}>
          <Ellipse cx={68} cy={124} rx={10} ry={6} fill="#F4B6B0" />
          <Ellipse cx={152} cy={124} rx={10} ry={6} fill="#F4B6B0" />
        </G>
      )}
      <Parts face={face} />
    </Svg>
  );
}

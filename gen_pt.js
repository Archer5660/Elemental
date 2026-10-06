const fs = require('fs');

const elements = [
  // row 1
  { n: 1, sym: 'H', c: 1, r: 1, type: 'nonmetal' }, { n: 2, sym: 'He', c: 18, r: 1, type: 'noble' },
  // row 2
  { n: 3, sym: 'Li', c: 1, r: 2, type: 'alkali' }, { n: 4, sym: 'Be', c: 2, r: 2, type: 'alkaline' },
  { n: 5, sym: 'B', c: 13, r: 2, type: 'metalloid' }, { n: 6, sym: 'C', c: 14, r: 2, type: 'nonmetal' }, { n: 7, sym: 'N', c: 15, r: 2, type: 'nonmetal' }, { n: 8, sym: 'O', c: 16, r: 2, type: 'nonmetal' }, { n: 9, sym: 'F', c: 17, r: 2, type: 'halogen' }, { n: 10, sym: 'Ne', c: 18, r: 2, type: 'noble' },
  // row 3
  { n: 11, sym: 'Na', c: 1, r: 3, type: 'alkali' }, { n: 12, sym: 'Mg', c: 2, r: 3, type: 'alkaline' },
  { n: 13, sym: 'Al', c: 13, r: 3, type: 'postTransition' }, { n: 14, sym: 'Si', c: 14, r: 3, type: 'metalloid' }, { n: 15, sym: 'P', c: 15, r: 3, type: 'nonmetal' }, { n: 16, sym: 'S', c: 16, r: 3, type: 'nonmetal' }, { n: 17, sym: 'Cl', c: 17, r: 3, type: 'halogen' }, { n: 18, sym: 'Ar', c: 18, r: 3, type: 'noble' },
  // row 4
  { n: 19, sym: 'K', c: 1, r: 4, type: 'alkali' }, { n: 20, sym: 'Ca', c: 2, r: 4, type: 'alkaline' },
  { n: 21, sym: 'Sc', c: 3, r: 4, type: 'transition' }, { n: 22, sym: 'Ti', c: 4, r: 4, type: 'transition' }, { n: 23, sym: 'V', c: 5, r: 4, type: 'transition' }, { n: 24, sym: 'Cr', c: 6, r: 4, type: 'transition' }, { n: 25, sym: 'Mn', c: 7, r: 4, type: 'transition' }, { n: 26, sym: 'Fe', c: 8, r: 4, type: 'transition' }, { n: 27, sym: 'Co', c: 9, r: 4, type: 'transition' }, { n: 28, sym: 'Ni', c: 10, r: 4, type: 'transition' }, { n: 29, sym: 'Cu', c: 11, r: 4, type: 'transition' }, { n: 30, sym: 'Zn', c: 12, r: 4, type: 'transition' },
  { n: 31, sym: 'Ga', c: 13, r: 4, type: 'postTransition' }, { n: 32, sym: 'Ge', c: 14, r: 4, type: 'metalloid' }, { n: 33, sym: 'As', c: 15, r: 4, type: 'metalloid' }, { n: 34, sym: 'Se', c: 16, r: 4, type: 'nonmetal' }, { n: 35, sym: 'Br', c: 17, r: 4, type: 'halogen' }, { n: 36, sym: 'Kr', c: 18, r: 4, type: 'noble' },

  // row 5
  { n: 37, sym: 'Rb', c: 1, r: 5, type: 'alkali' }, { n: 38, sym: 'Sr', c: 2, r: 5, type: 'alkaline' },
  { n: 39, sym: 'Y', c: 3, r: 5, type: 'transition' }, { n: 40, sym: 'Zr', c: 4, r: 5, type: 'transition' }, { n: 41, sym: 'Nb', c: 5, r: 5, type: 'transition' }, { n: 42, sym: 'Mo', c: 6, r: 5, type: 'transition' }, { n: 43, sym: 'Tc', c: 7, r: 5, type: 'transition' }, { n: 44, sym: 'Ru', c: 8, r: 5, type: 'transition' }, { n: 45, sym: 'Rh', c: 9, r: 5, type: 'transition' }, { n: 46, sym: 'Pd', c: 10, r: 5, type: 'transition' }, { n: 47, sym: 'Ag', c: 11, r: 5, type: 'transition' }, { n: 48, sym: 'Cd', c: 12, r: 5, type: 'transition' },
  { n: 49, sym: 'In', c: 13, r: 5, type: 'postTransition' }, { n: 50, sym: 'Sn', c: 14, r: 5, type: 'postTransition' }, { n: 51, sym: 'Sb', c: 15, r: 5, type: 'metalloid' }, { n: 52, sym: 'Te', c: 16, r: 5, type: 'metalloid' }, { n: 53, sym: 'I', c: 17, r: 5, type: 'halogen' }, { n: 54, sym: 'Xe', c: 18, r: 5, type: 'noble' },

  // row 6
  { n: 55, sym: 'Cs', c: 1, r: 6, type: 'alkali' }, { n: 56, sym: 'Ba', c: 2, r: 6, type: 'alkaline' },
  // skip 57-71 (Lanthanides) -> put at bottom
  { n: 72, sym: 'Hf', c: 4, r: 6, type: 'transition' }, { n: 73, sym: 'Ta', c: 5, r: 6, type: 'transition' }, { n: 74, sym: 'W', c: 6, r: 6, type: 'transition' }, { n: 75, sym: 'Re', c: 7, r: 6, type: 'transition' }, { n: 76, sym: 'Os', c: 8, r: 6, type: 'transition' }, { n: 77, sym: 'Ir', c: 9, r: 6, type: 'transition' }, { n: 78, sym: 'Pt', c: 10, r: 6, type: 'transition' }, { n: 79, sym: 'Au', c: 11, r: 6, type: 'transition' }, { n: 80, sym: 'Hg', c: 12, r: 6, type: 'transition' },
  { n: 81, sym: 'Tl', c: 13, r: 6, type: 'postTransition' }, { n: 82, sym: 'Pb', c: 14, r: 6, type: 'postTransition' }, { n: 83, sym: 'Bi', c: 15, r: 6, type: 'postTransition' }, { n: 84, sym: 'Po', c: 16, r: 6, type: 'postTransition' }, { n: 85, sym: 'At', c: 17, r: 6, type: 'halogen' }, { n: 86, sym: 'Rn', c: 18, r: 6, type: 'noble' },

  // row 7
  { n: 87, sym: 'Fr', c: 1, r: 7, type: 'alkali' }, { n: 88, sym: 'Ra', c: 2, r: 7, type: 'alkaline' },
  // skip 89-103 (Actinides)
  { n: 104, sym: 'Rf', c: 4, r: 7, type: 'transition' }, { n: 105, sym: 'Db', c: 5, r: 7, type: 'transition' }, { n: 106, sym: 'Sg', c: 6, r: 7, type: 'transition' }, { n: 107, sym: 'Bh', c: 7, r: 7, type: 'transition' }, { n: 108, sym: 'Hs', c: 8, r: 7, type: 'transition' }, { n: 109, sym: 'Mt', c: 9, r: 7, type: 'transition' }, { n: 110, sym: 'Ds', c: 10, r: 7, type: 'transition' }, { n: 111, sym: 'Rg', c: 11, r: 7, type: 'transition' }, { n: 112, sym: 'Cn', c: 12, r: 7, type: 'transition' },
  { n: 113, sym: 'Nh', c: 13, r: 7, type: 'postTransition' }, { n: 114, sym: 'Fl', c: 14, r: 7, type: 'postTransition' }, { n: 115, sym: 'Mc', c: 15, r: 7, type: 'postTransition' }, { n: 116, sym: 'Lv', c: 16, r: 7, type: 'postTransition' }, { n: 117, sym: 'Ts', c: 17, r: 7, type: 'halogen' }, { n: 118, sym: 'Og', c: 18, r: 7, type: 'noble' },

  // row 8.5 (Lanthanides)
  ...['La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu'].map((s, i) => ({ n: 57+i, sym: s, c: 3+i, r: 9, type: 'lanthanide'})),

  // row 9 (Actinides)
  ...['Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr'].map((s, i) => ({ n: 89+i, sym: s, c: 3+i, r: 10, type: 'actinide'}))
];

console.log(JSON.stringify(elements));

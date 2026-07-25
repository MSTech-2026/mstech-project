export const MACHINE_ORDER: string[] = [
  'D1120234771',
  'D1120234772',
  'D1120234773',
  'D0220244829',
  'D0220244830',
  'D1220244957',
  'D1220244958',
  'D1220244959',
  'D0320254990',
  'D0320254987',
  'D0320254986',
  'D0320254992',
  'D0320254979',
  'D0320254973',
  'D0320254978',
  'D0320254980',
  'D0320254985',
  'D0320254993',
  'D0320254982',
  'D0320254974',
  'D0320254976',
  'D0320254981',
  'D0320254977',
  'D0320254983',
  'D0320254984',
  'D0320254989',
  'D0320254988',
  'D0320254975',
  'D0320254991',
];

export function sortMachines<T extends { serial_number: string }>(machines: T[]): T[] {
  const orderMap = new Map(MACHINE_ORDER.map((sn, i) => [sn, i]));
  return [...machines].sort((a, b) => {
    const ai = orderMap.get(a.serial_number);
    const bi = orderMap.get(b.serial_number);
    if (ai !== undefined && bi !== undefined) return ai - bi;
    if (ai !== undefined) return -1;
    if (bi !== undefined) return 1;
    return a.serial_number.localeCompare(b.serial_number);
  });
}

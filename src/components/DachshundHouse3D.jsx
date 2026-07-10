import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const MATERIALS = {
  wood: new THREE.MeshStandardMaterial({ color: 0x9a623f, roughness: 0.82 }),
  darkWood: new THREE.MeshStandardMaterial({ color: 0x62402f, roughness: 0.88 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xfff0d1, roughness: 0.9 }),
  rose: new THREE.MeshStandardMaterial({ color: 0xe98791, roughness: 0.86 }),
  violet: new THREE.MeshStandardMaterial({ color: 0x9a7bc4, roughness: 0.82 }),
  green: new THREE.MeshStandardMaterial({ color: 0x4f9e71, roughness: 0.9 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xe8c76d, metalness: 0.45, roughness: 0.45 })
};

const box = (width, height, depth, material, x = 0, y = height / 2, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const sphere = (radius, material, x, y, z, scale = [1, 1, 1]) => {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), material);
  mesh.position.set(x, y, z);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  return mesh;
};

function makeDog(outfit, dogColor, appearance = {}) {
  const dog = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: dogColor || 0xa96338, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x4b291d, roughness: 0.95 });
  const black = new THREE.MeshStandardMaterial({ color: 0x17100e, roughness: 0.7 });

  dog.add(sphere(0.48, fur, 0, 0.67, 0, [1.65, 0.72, 0.72]));
  dog.add(sphere(0.42, fur, 0.9, 0.79, 0, [0.85, 1, 0.86]));
  dog.add(sphere(0.25, fur, 1.2, 0.69, 0, [1.05, 0.65, 0.65]));
  dog.add(sphere(0.1, black, 1.43, 0.7, 0, [1, 0.72, 0.85]));
  dog.add(sphere(0.045, black, 1.02, 0.92, -0.31));
  dog.add(sphere(0.045, black, 1.02, 0.92, 0.31));

  const earGeometry = new THREE.SphereGeometry(0.26, 18, 12);
  [-0.31, 0.31].forEach((z) => {
    const ear = new THREE.Mesh(earGeometry, dark);
    ear.position.set(0.72, 0.78, z);
    const earScale = appearance.ears === 'floppy' ? 1.55 : appearance.ears === 'tiny' ? 0.72 : 1.28;
    ear.scale.set(0.55, earScale, 0.5);
    ear.rotation.z = -0.25;
    ear.castShadow = true;
    dog.add(ear);
  });

  let legIndex = 0;
  [-0.55, 0.55].forEach((x) => {
    [-0.27, 0.27].forEach((z) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.47, 14), fur);
      leg.position.set(x, 0.3, z);
      leg.castShadow = true;
      leg.userData.isLeg = true;
      leg.userData.walkPhase = legIndex % 2 === 0 ? 0 : Math.PI;
      legIndex += 1;
      dog.add(leg);
    });
  });

  const tailPivot = new THREE.Group();
  tailPivot.position.set(-0.88, 0.75, 0);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.75, 12), fur);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -0.34;
  tail.castShadow = true;
  tailPivot.add(tail);
  tailPivot.userData.isTail = true;
  dog.add(tailPivot);

  if (outfit === 'outfit-bandana') {
    const bandana = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.55, 3),
      new THREE.MeshStandardMaterial({ color: 0xe94f5f, roughness: 0.8 })
    );
    bandana.position.set(0.59, 0.55, 0);
    bandana.rotation.z = -Math.PI / 2;
    dog.add(bandana);
  }

  if (outfit === 'outfit-crown') {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.38, 5, 1, true), MATERIALS.metal);
    crown.position.set(0.9, 1.33, 0);
    crown.rotation.y = Math.PI / 5;
    dog.add(crown);
  }

  if (outfit === 'outfit-sweater') {
    dog.add(sphere(0.5, new THREE.MeshStandardMaterial({ color: 0x9b72d2, roughness: 0.88 }), -0.08, 0.68, 0, [1.4, 0.74, 0.75]));
  }

  if (outfit === 'outfit-glasses') {
    [-0.25, 0.25].forEach((z) => {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 10, 20), black);
      lens.position.set(1.24, 0.91, z);
      lens.rotation.y = Math.PI / 2;
      dog.add(lens);
    });
    dog.add(box(0.04, 0.035, 0.22, black, 1.24, 0.91, 0));
  }

  if (outfit === 'outfit-hat') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.07, 24), dark);
    brim.position.set(0.88, 1.23, 0);
    dog.add(brim);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.42, 24), dark);
    top.position.set(0.88, 1.45, 0);
    dog.add(top);
  }

  if (outfit === 'outfit-cape') {
    const cape = box(1.05, 0.06, 0.68, new THREE.MeshStandardMaterial({ color: 0x4f79d8, roughness: 0.82 }), -0.12, 0.93, 0);
    cape.rotation.z = -0.08;
    dog.add(cape);
  }

  if (appearance.pattern === 'dapple') {
    const spotMaterial = new THREE.MeshStandardMaterial({ color: 0x6f412b, roughness: 0.95 });
    [[-.4, .92, .3], [.05, .9, -.33], [.45, .88, .28]].forEach(([x, y, z]) => {
      dog.add(sphere(0.15, spotMaterial, x, y, z, [1.35, .35, 1]));
    });
  }

  if (appearance.pattern === 'piebald') {
    const patchMaterial = new THREE.MeshStandardMaterial({ color: 0xf4e5cc, roughness: 0.95 });
    dog.add(sphere(0.33, patchMaterial, -0.38, 0.78, 0, [.65, .5, 1.08]));
    dog.add(sphere(0.25, patchMaterial, 0.82, 0.95, 0.18, [.7, .45, .7]));
  }

  dog.position.set(0, 0, 0.4);
  dog.rotation.y = -0.35;
  dog.scale.setScalar(appearance.size || 1);
  dog.userData.isDog = true;
  dog.traverse((child) => {
    child.userData.isDog = true;
  });
  return dog;
}

function makeFurniture(item) {
  const group = new THREE.Group();
  const { type } = item;

  if (type === 'floorTile') {
    const tileMaterial = new THREE.MeshStandardMaterial({ color: 0xd8bea2, roughness: 0.82, metalness: 0.03 });
    const tile = box(2, 0.12, 2, tileMaterial, 0, 0.06, 0);
    tile.receiveShadow = true;
    group.add(tile);
    group.add(box(1.94, 0.018, 0.035, MATERIALS.cream, 0, 0.13, 0.98));
    group.add(box(0.035, 0.018, 1.94, MATERIALS.cream, 0.98, 0.13, 0));
  } else if (type === 'stairs') {
    const stairMaterial = new THREE.MeshStandardMaterial({ color: 0xb47b52, roughness: 0.86 });
    for (let index = 0; index < 9; index += 1) {
      const height = 0.35 * (index + 1);
      const step = box(1.8, height, 0.42, stairMaterial, 0, height / 2, -1.65 + index * 0.4);
      step.castShadow = true;
      step.receiveShadow = true;
      group.add(step);
    }
    [-1, 1].forEach((side) => {
      const rail = box(0.06, 0.06, 4.05, MATERIALS.darkWood, side * 0.88, 1.95, -0.05);
      rail.rotation.x = -0.66;
      group.add(rail);
    });
  } else if (type === 'bed') {
    group.add(box(1.65, 0.25, 1.05, MATERIALS.darkWood));
    group.add(box(1.45, 0.22, 0.88, MATERIALS.rose, 0, 0.3, 0));
    group.add(box(0.5, 0.14, 0.72, MATERIALS.cream, -0.38, 0.47, 0));
  } else if (type === 'sofa') {
    group.add(box(1.75, 0.48, 0.72, MATERIALS.violet));
    group.add(box(1.75, 0.72, 0.18, MATERIALS.violet, 0, 0.65, 0.31));
    group.add(box(0.18, 0.58, 0.78, MATERIALS.violet, -0.86, 0.48, 0));
    group.add(box(0.18, 0.58, 0.78, MATERIALS.violet, 0.86, 0.48, 0));
  } else if (type === 'table') {
    group.add(box(1.1, 0.12, 0.75, MATERIALS.wood, 0, 0.76, 0));
    [-0.43, 0.43].forEach((x) => [-0.25, 0.25].forEach((z) => {
      group.add(box(0.1, 0.72, 0.1, MATERIALS.darkWood, x, 0.36, z));
    }));
  } else if (type === 'plant') {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.42, 18), MATERIALS.rose);
    pot.position.y = 0.22;
    pot.castShadow = true;
    group.add(pot);
    for (let index = 0; index < 6; index += 1) {
      const leaf = sphere(0.22, MATERIALS.green, Math.sin(index) * 0.22, 0.62 + (index % 2) * 0.18, Math.cos(index) * 0.2, [0.55, 1.4, 0.6]);
      leaf.rotation.z = Math.sin(index) * 0.45;
      group.add(leaf);
    }
  } else if (type === 'lamp') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 1.3, 12), MATERIALS.metal);
    pole.position.y = 0.66;
    group.add(pole);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.48, 20, 1, true), MATERIALS.cream);
    shade.position.y = 1.3;
    group.add(shade);
    const light = new THREE.PointLight(0xffd8a0, 0.8, 4);
    light.position.y = 1.2;
    group.add(light);
  } else if (type === 'rug') {
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.035, 32), MATERIALS.cream);
    rug.scale.z = 0.65;
    rug.position.y = 0.025;
    rug.receiveShadow = true;
    group.add(rug);
  } else if (type === 'wall') {
    group.add(box(2, 2.7, 0.14, MATERIALS.cream, 0, 1.35, 0));
    group.add(box(2.05, 0.1, 0.2, MATERIALS.darkWood, 0, 0.08, 0));
  } else if (type === 'fridge') {
    group.add(box(0.95, 1.85, 0.82, new THREE.MeshStandardMaterial({ color: 0x9bc9c9, metalness: 0.15, roughness: 0.55 })));
    group.add(box(0.04, 0.62, 0.06, MATERIALS.metal, 0.34, 1.18, 0.44));
    group.add(box(0.04, 0.35, 0.06, MATERIALS.metal, 0.34, 0.48, 0.44));
    group.add(box(0.84, 0.025, 0.04, MATERIALS.darkWood, 0, 0.68, 0.43));
  } else if (type === 'stove') {
    group.add(box(1.05, 0.9, 0.82, new THREE.MeshStandardMaterial({ color: 0xe6dfd3, metalness: 0.2, roughness: 0.45 })));
    group.add(box(0.82, 0.5, 0.035, new THREE.MeshStandardMaterial({ color: 0x25272d }), 0, 0.42, 0.43));
    [-0.28, 0.28].forEach((x) => [-0.2, 0.2].forEach((z) => {
      const burner = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.025, 18), MATERIALS.darkWood);
      burner.position.set(x, 0.92, z);
      group.add(burner);
    }));
  } else if (type === 'sink') {
    group.add(box(1.15, 0.82, 0.72, MATERIALS.cream));
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.07, 24), new THREE.MeshStandardMaterial({ color: 0xb7c3ca, metalness: 0.5 }));
    basin.position.set(0, 0.86, 0);
    group.add(basin);
    const tap = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 10, 18, Math.PI), MATERIALS.metal);
    tap.position.set(0, 1.05, -0.18);
    tap.rotation.x = Math.PI / 2;
    group.add(tap);
  } else if (type === 'desk') {
    group.add(box(1.55, 0.12, 0.7, MATERIALS.wood, 0, 0.82, 0));
    group.add(box(0.12, 0.8, 0.62, MATERIALS.darkWood, -0.65, 0.4, 0));
    group.add(box(0.12, 0.8, 0.62, MATERIALS.darkWood, 0.65, 0.4, 0));
    const laptop = box(0.55, 0.38, 0.035, new THREE.MeshStandardMaterial({ color: 0x343945, metalness: 0.3 }), 0.2, 1.08, -0.14);
    laptop.rotation.x = -0.18;
    group.add(laptop);
  } else if (type === 'bookshelf') {
    group.add(box(1.25, 2.05, 0.36, MATERIALS.darkWood));
    [-0.58, 0, 0.58].forEach((y) => group.add(box(1.12, 0.07, 0.4, MATERIALS.wood, 0, 1.02 + y, 0)));
    const bookColors = [0xe36f65, 0x5f87bf, 0x73a66a, 0xd9ac55];
    for (let index = 0; index < 12; index += 1) {
      const shelf = Math.floor(index / 4);
      group.add(box(0.13, 0.38 + (index % 2) * 0.08, 0.25, new THREE.MeshStandardMaterial({ color: bookColors[index % 4] }), -0.42 + (index % 4) * 0.28, 0.28 + shelf * 0.58, 0.02));
    }
  } else if (type === 'shower') {
    const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x9ed8ed, transparent: true, opacity: 0.36, metalness: 0.1 });
    group.add(box(1.15, 0.1, 1.05, MATERIALS.cream, 0, 0.05, 0));
    group.add(box(0.06, 2.05, 1.05, glassMaterial, -0.55, 1.02, 0));
    group.add(box(1.15, 2.05, 0.06, glassMaterial, 0, 1.02, -0.5));
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.55, 10), MATERIALS.metal);
    pipe.position.set(0.35, 1.25, -0.44);
    group.add(pipe);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.08, 18), MATERIALS.metal);
    head.position.set(0.35, 1.98, -0.32);
    head.rotation.x = Math.PI / 2;
    group.add(head);
  } else if (type === 'tree') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.8, 14), MATERIALS.darkWood);
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    group.add(trunk);
    group.add(sphere(0.9, MATERIALS.green, 0, 2.1, 0, [1, 1.15, 1]));
    group.add(sphere(0.62, MATERIALS.green, 0.55, 2.05, 0.15));
    group.add(sphere(0.62, MATERIALS.green, -0.55, 2, -0.1));
  } else if (type === 'flowers') {
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 24), new THREE.MeshStandardMaterial({ color: 0x6d432d }));
    soil.scale.z = 0.58;
    soil.position.y = 0.06;
    group.add(soil);
    const flowerColors = [0xff6f91, 0xffd166, 0x8bd3ff, 0xc99cff];
    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * Math.PI * 2;
      const radius = index % 2 ? 0.55 : 0.3;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 8), MATERIALS.green);
      stem.position.set(Math.cos(angle) * radius, 0.22, Math.sin(angle) * radius * 0.6);
      group.add(stem);
      group.add(sphere(0.1, new THREE.MeshStandardMaterial({ color: flowerColors[index % flowerColors.length] }), stem.position.x, 0.4, stem.position.z));
    }
  } else if (type === 'fence') {
    [-0.78, 0, 0.78].forEach((x) => group.add(box(0.12, 1.05, 0.13, MATERIALS.cream, x, 0.52, 0)));
    group.add(box(1.8, 0.12, 0.12, MATERIALS.cream, 0, 0.35, 0));
    group.add(box(1.8, 0.12, 0.12, MATERIALS.cream, 0, 0.76, 0));
  } else if (type === 'bench') {
    group.add(box(1.65, 0.16, 0.55, MATERIALS.wood, 0, 0.55, 0));
    group.add(box(1.65, 0.65, 0.12, MATERIALS.wood, 0, 0.88, -0.25));
    [-0.62, 0.62].forEach((x) => group.add(box(0.12, 0.55, 0.45, MATERIALS.darkWood, x, 0.27, 0)));
  } else if (type === 'door') {
    group.add(box(1.15, 2.35, 0.16, MATERIALS.darkWood, 0, 1.18, 0));
    group.add(sphere(0.06, MATERIALS.metal, 0.38, 1.12, 0.11));
  } else if (type === 'window') {
    const glass = new THREE.MeshStandardMaterial({ color: 0x8fd4eb, transparent: true, opacity: .68 });
    group.add(box(1.8, 1.35, 0.08, glass, 0, 1.35, 0));
    group.add(box(1.95, .1, .14, MATERIALS.cream, 0, .68, 0));
    group.add(box(1.95, .1, .14, MATERIALS.cream, 0, 2.02, 0));
    group.add(box(.1, 1.45, .14, MATERIALS.cream, -.92, 1.35, 0));
    group.add(box(.1, 1.45, .14, MATERIALS.cream, .92, 1.35, 0));
  } else if (type === 'roof') {
    group.add(box(2.5, 2.4, 2.1, MATERIALS.cream, 0, 1.2, 0));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.05, 4), MATERIALS.darkWood);
    roof.position.y = 2.9;
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = .8;
    roof.castShadow = true;
    group.add(roof);
  } else if (type === 'garden') {
    group.add(box(2.1, .22, 1.25, new THREE.MeshStandardMaterial({ color: 0x71452d }), 0, .11, 0));
    for (let index = 0; index < 6; index += 1) {
      group.add(sphere(.12, MATERIALS.green, -.72 + (index % 3) * .72, .32, -.3 + Math.floor(index / 3) * .6, [.55, 1.3, .55]));
    }
  }

  group.position.set(item.x, (item.level || 0) * 3.15, item.z);
  group.rotation.y = item.rotation || 0;
  group.scale.setScalar(item.scale || 1);
  if (item.color && !['plant', 'tree', 'flowers'].includes(type)) {
    group.traverse((child) => {
      if (!child.isMesh) return;
      child.material = child.material.clone();
      child.material.color.set(item.color);
    });
  }
  group.userData.layoutId = item.id;
  group.userData.layoutType = item.type;
  group.traverse((child) => {
    child.userData.layoutId = item.id;
    child.userData.layoutType = item.type;
  });
  return group;
}

function makeCar(color, vehicle = 'car') {
  const car = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: color || 0xef5350, metalness: 0.22, roughness: 0.42 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x8ac5dc, metalness: 0.2, roughness: 0.25, transparent: true, opacity: 0.78 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x17191e, roughness: 0.78 });

  if (vehicle === 'scooter') {
    car.add(box(.55, .16, 1.55, paint, 0, .48, 0));
    car.add(box(.65, .18, .65, MATERIALS.darkWood, 0, .73, -.25));
    car.add(box(.06, 1.05, .06, MATERIALS.metal, 0, .92, .55));
    car.add(box(.7, .06, .06, MATERIALS.metal, 0, 1.42, .55));
    [-.62, .62].forEach((z) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.29, .29, .18, 20), rubber);
      wheel.position.set(0, .3, z);
      wheel.rotation.z = Math.PI / 2;
      car.add(wheel);
    });
  } else {
    const isVan = vehicle === 'van';
    car.add(box(isVan ? 1.85 : 1.65, isVan ? .78 : .48, isVan ? 3.2 : 2.65, paint, 0, isVan ? .68 : .52, 0));
    car.add(box(isVan ? 1.62 : 1.42, isVan ? .82 : .62, isVan ? 1.8 : 1.32, glass, 0, isVan ? 1.28 : .94, -.18));
    car.add(box(1.5, 0.13, 0.18, MATERIALS.cream, 0, 0.55, isVan ? 1.62 : 1.34));
    [-0.83, 0.83].forEach((x) => [-0.78, 0.78].forEach((z) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.18, 20), rubber);
      wheel.position.set(x, 0.35, z * (isVan ? 1.35 : 1));
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      car.add(wheel);
    }));
  }
  car.userData.layoutType = 'car';
  car.traverse((child) => {
    child.userData.layoutType = 'car';
  });
  return car;
}

function makeNeighborHouse(x, z, color, rotation = 0) {
  const house = new THREE.Group();
  const wall = new THREE.MeshStandardMaterial({ color, roughness: 0.96 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x68473e, roughness: 0.92 });
  house.add(box(5.2, 2.7, 4.4, wall, 0, 1.35, 0));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.8, 4), roofMaterial);
  roof.position.y = 3.5;
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.85;
  roof.castShadow = true;
  house.add(roof);
  const door = box(0.85, 1.75, 0.08, MATERIALS.darkWood, 0, 0.88, -2.23);
  house.add(door);
  [-1.55, 1.55].forEach((windowX) => {
    house.add(box(0.9, 0.85, 0.08, new THREE.MeshStandardMaterial({ color: 0x8fd4eb, emissive: 0x183240, emissiveIntensity: 0.14 }), windowX, 1.55, -2.24));
  });
  house.position.set(x, 0, z);
  house.rotation.y = rotation;
  return house;
}

const roomPalette = {
  'room-sunny': { sky: 0xfbd9a5, floor: 0xba8059, wall: 0xffe7bd },
  'room-night': { sky: 0x252a4a, floor: 0x6c506c, wall: 0x454b79 },
  'room-rose': { sky: 0xf6c5cd, floor: 0xaa737e, wall: 0xf8d7dc }
};

export default function DachshundHouse3D({
  layout,
  room,
  outfit,
  colors,
  appearance,
  world,
  garden,
  vehicle,
  animation,
  away,
  departing,
  carAway,
  buildMode,
  activeFloor,
  selectedTool,
  rotation,
  placementColor,
  onLayoutChange,
  onInteract,
  onDogClick,
  autonomous,
  landscapeMode,
  resetCameraKey,
  dogFloor,
  onBuildFeedback
}) {
  const mountRef = useRef(null);
  const handlerRef = useRef(onLayoutChange);
  const interactionRef = useRef(onInteract);
  const dogClickRef = useRef(onDogClick);
  const buildFeedbackRef = useRef(onBuildFeedback);
  const animationRef = useRef(animation);
  const cameraStateRef = useRef(null);
  const dogPositionRef = useRef(new THREE.Vector3(0, 0, 0.4));

  useEffect(() => {
    handlerRef.current = onLayoutChange;
  }, [onLayoutChange]);

  useEffect(() => {
    interactionRef.current = onInteract;
  }, [onInteract]);

  useEffect(() => {
    dogClickRef.current = onDogClick;
  }, [onDogClick]);

  useEffect(() => {
    buildFeedbackRef.current = onBuildFeedback;
  }, [onBuildFeedback]);

  useEffect(() => {
    cameraStateRef.current = null;
  }, [resetCameraKey]);

  useEffect(() => {
    animationRef.current = animation;
  }, [animation]);

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const palette = roomPalette[room] || roomPalette['room-sunny'];
    const hour = Number.isFinite(world?.simHour) ? world.simHour : new Date().getHours();
    const isNight = world?.time === 'night' || (world?.time === 'auto' && (hour < 6 || hour >= 19));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isNight ? 0x10152f : palette.sky);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    if (cameraStateRef.current) {
      camera.position.copy(cameraStateRef.current.position);
    } else {
      camera.position.set(21, 16, 24);
      camera.lookAt(0, 0.7, -1);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = 'none';
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = landscapeMode ? 0.12 : 0.07;
    controls.rotateSpeed = landscapeMode ? 0.48 : 0.8;
    controls.zoomSpeed = landscapeMode ? 0.58 : 0.85;
    controls.panSpeed = landscapeMode ? 0.45 : 0.8;
    controls.minDistance = 8;
    controls.maxDistance = 76;
    controls.maxPolarAngle = Math.PI / 2.08;
    if (cameraStateRef.current) controls.target.copy(cameraStateRef.current.target);
    else controls.target.set(0, 0.45, -1);
    controls.target.y = (buildMode ? activeFloor || 0 : dogFloor || 0) * 3.15 + 0.45;

    scene.add(new THREE.HemisphereLight(isNight ? 0x8895d8 : 0xfff4df, 0x4d526c, isNight ? 1.1 : 2.3));
    const sun = new THREE.DirectionalLight(isNight ? 0x7f8bd8 : 0xffead1, isNight ? 1.2 : 3);
    sun.position.set(5, 9, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    scene.add(sun);

    const grass = box(64, 0.14, 50, new THREE.MeshStandardMaterial({ color: 0x77a85e, roughness: 1 }), 0, -0.2, 0);
    scene.add(grass);
    const road = box(64, 0.12, 4.2, new THREE.MeshStandardMaterial({ color: 0x343940, roughness: 0.96 }), 0, -0.1, 9);
    scene.add(road);
    const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0xb9b5ad, roughness: 0.95 });
    const sidewalk = box(64, 0.15, 1.1, sidewalkMaterial, 0, -0.02, 6.45);
    scene.add(sidewalk);
    scene.add(box(64, 0.15, 1.1, sidewalkMaterial, 0, -0.02, 11.55));
    for (let x = -28; x <= 28; x += 4) {
      scene.add(box(2.2, 0.025, 0.16, new THREE.MeshStandardMaterial({ color: 0xf6d968 }), x, -0.02, 9));
    }
    const drivewayMaterial = new THREE.MeshStandardMaterial({ color: 0xaaa59c, roughness: 0.94 });
    scene.add(box(4.2, 0.12, 5.5, drivewayMaterial, 5.5, -0.01, 5));

    const floorMaterial = new THREE.MeshStandardMaterial({ color: colors?.floor || palette.floor, roughness: 0.92 });
    const floor = box(18, 0.18, 14, floorMaterial, 0, -0.09, -1);
    floor.name = 'build-floor';
    scene.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: colors?.walls || palette.wall, roughness: 0.95 });
    scene.add(box(18, 3.4, 0.18, wallMaterial, 0, 1.7, -8));
    scene.add(box(0.18, 3.4, 14, wallMaterial, -9, 1.7, -1));

    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x7a5038, roughness: 0.88 });
    scene.add(box(18, 0.16, 0.22, trimMaterial, 0, 0.13, -7.88));
    scene.add(box(0.22, 0.16, 14, trimMaterial, -8.88, 0.13, -1));

    const windowFrame = new THREE.Group();
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.5),
      new THREE.MeshStandardMaterial({ color: room === 'room-night' ? 0x162048 : 0x8bd3f2, emissive: room === 'room-night' ? 0x101a40 : 0x183340, emissiveIntensity: 0.2 })
    );
    glass.position.set(1.5, 1.9, -7.88);
    windowFrame.add(glass);
    windowFrame.add(box(2, 0.1, 0.12, MATERIALS.cream, 1.5, 2.66, -7.78));
    windowFrame.add(box(2, 0.1, 0.12, MATERIALS.cream, 1.5, 1.14, -7.78));
    windowFrame.add(box(0.1, 1.62, 0.12, MATERIALS.cream, 0.53, 1.9, -7.78));
    windowFrame.add(box(0.1, 1.62, 0.12, MATERIALS.cream, 2.47, 1.9, -7.78));
    scene.add(windowFrame);

    const garageWall = new THREE.MeshStandardMaterial({ color: colors?.walls || 0xd8d1c4, roughness: 0.92 });
    scene.add(box(0.16, 2.8, 5.6, garageWall, 3.5, 1.4, 1.8));
    scene.add(box(0.16, 2.8, 5.6, garageWall, 7.5, 1.4, 1.8));
    scene.add(box(4.2, 2.8, 0.16, garageWall, 5.5, 1.4, -1));
    const garageRoof = box(4.35, 0.14, 5.8, new THREE.MeshStandardMaterial({ color: 0x6e625b, transparent: true, opacity: 0.82 }), 5.5, 2.84, 1.8);
    scene.add(garageRoof);
    scene.add(box(4.1, 0.09, 5.4, drivewayMaterial, 5.5, 0.01, 1.8));
    const car = carAway ? null : makeCar(colors?.car, vehicle);
    if (car) {
      car.position.set(5.5, 0, 2.2);
      scene.add(car);
    }

    const neighborColors = [0xe7b39c, 0xa9c6df, 0xd9c493, 0xb9a9d6];
    [-24, -12, 0, 12].forEach((x, index) => {
      scene.add(makeNeighborHouse(x, 17.5, neighborColors[index]));
    });
    scene.add(makeNeighborHouse(-27, -2, 0xe3c2a2, -Math.PI / 2));
    scene.add(makeNeighborHouse(27, -2, 0xa9cfb2, Math.PI / 2));

    const neighborDogs = [
      { name: 'Luna', color: 0xd8ad79, x: -18, z: 13 },
      { name: 'Bruno', color: 0x5c392a, x: -7, z: 13.2 },
      { name: 'Coco', color: 0xd9c4a4, x: 6, z: 13 }
    ].map((neighbor) => {
      const neighborDog = makeDog('outfit-none', neighbor.color, { size: .82, ears: 'classic', pattern: 'solid' });
      neighborDog.position.set(neighbor.x, 0, neighbor.z);
      neighborDog.traverse((child) => {
        child.userData.isDog = false;
        child.userData.isNeighbor = neighbor.name;
      });
      scene.add(neighborDog);
      return neighborDog;
    });

    scene.add(makeFurniture({ id: 'garden-tree', type: 'tree', x: -14, z: 0, rotation: 0 }));
    scene.add(makeFurniture({ id: 'garden-flowers-a', type: 'flowers', x: -13, z: 4, rotation: 0 }));
    scene.add(makeFurniture({ id: 'garden-flowers-b', type: 'flowers', x: -10.8, z: 5, rotation: 0 }));
    scene.add(makeFurniture({ id: 'garden-bench', type: 'bench', x: -13, z: -3, rotation: Math.PI / 2 }));
    for (let x = -17; x <= -10; x += 2) {
      scene.add(makeFurniture({ id: `garden-fence-${x}`, type: 'fence', x, z: 6, rotation: 0 }));
    }

    if (garden?.plantedAt) {
      const gardenGroup = makeFurniture({ id: 'active-garden', type: 'garden', x: -11, z: 4, rotation: 0 });
      gardenGroup.scale.y = .35 + Math.min(1, (Date.now() - garden.plantedAt) / 60000) * .65;
      scene.add(gardenGroup);
    }

    if (world?.weather === 'rain' || world?.weather === 'snow') {
      const positions = new Float32Array(700 * 3);
      for (let index = 0; index < 700; index += 1) {
        positions[index * 3] = (Math.random() - .5) * 60;
        positions[index * 3 + 1] = Math.random() * 16;
        positions[index * 3 + 2] = (Math.random() - .5) * 44;
      }
      const weatherGeometry = new THREE.BufferGeometry();
      weatherGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const weatherPoints = new THREE.Points(
        weatherGeometry,
        new THREE.PointsMaterial({ color: world.weather === 'snow' ? 0xffffff : 0x8bc7e8, size: world.weather === 'snow' ? .12 : .055, transparent: true, opacity: .8 })
      );
      weatherPoints.userData.isWeather = true;
      scene.add(weatherPoints);
    }

    layout.forEach((item) => scene.add(makeFurniture(item)));
    const dog = away ? null : makeDog(outfit, colors?.dog, appearance);
    if (dog) {
      dog.position.copy(dogPositionRef.current);
      dog.position.y = (dogFloor || 0) * 3.15;
      scene.add(dog);
    }

    if (buildMode) {
      const grid = new THREE.GridHelper(36, 36, 0xffffff, 0xffffff);
      grid.position.z = -4.5;
      grid.position.y = (activeFloor || 0) * 3.15 + 0.015;
      grid.material.opacity = 0.28;
      grid.material.transparent = true;
      scene.add(grid);
    }

    const buildGround = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 20),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    buildGround.rotation.x = -Math.PI / 2;
    const interactionFloor = buildMode ? activeFloor || 0 : dogFloor || 0;
    buildGround.position.set(0, interactionFloor * 3.15 + 0.04, -4.5);
    scene.add(buildGround);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dogTarget = new THREE.Vector3().copy(dogPositionRef.current);
    let dogIsMoving = false;
    let pointerStart = null;
    let selectedMoveItemId = null;
    let selectedMoveHelper = null;
    let nextAutonomyAt = 5;
    const getLayoutItem = (layoutId) => layout.find((item) => item.id === layoutId);
    const getActiveLayoutHit = (hits) => hits.find((entry) => {
      const item = getLayoutItem(entry.object.userData.layoutId);
      return item && (item.level || 0) === (activeFloor || 0);
    });
    const hasFloorSupport = (x, z, level, ignoredId = null) => level === 0 || layout.some((item) => (
      item.id !== ignoredId
      && item.type === 'floorTile'
      && (item.level || 0) === level
      && Math.abs(item.x - x) <= 1
      && Math.abs(item.z - z) <= 1
    ));
    const tileHasObjects = (tile) => layout.some((item) => (
      item.id !== tile.id
      && item.type !== 'floorTile'
      && (item.level || 0) === (tile.level || 0)
      && Math.abs(item.x - tile.x) <= 1
      && Math.abs(item.z - tile.z) <= 1
    ));
    const clearMoveSelection = () => {
      if (selectedMoveHelper) {
        scene.remove(selectedMoveHelper);
        selectedMoveHelper.geometry?.dispose?.();
        selectedMoveHelper.material?.dispose?.();
        selectedMoveHelper = null;
      }
      selectedMoveItemId = null;
    };
    const selectMoveItem = (layoutId) => {
      clearMoveSelection();
      selectedMoveItemId = layoutId;
      const target = scene.children.find((child) => child.userData.layoutId === layoutId);
      if (!target) return;
      selectedMoveHelper = new THREE.BoxHelper(target, 0xc7a7ff);
      selectedMoveHelper.userData.ignorePointer = true;
      selectedMoveHelper.material.transparent = true;
      selectedMoveHelper.material.opacity = 0.95;
      selectedMoveHelper.material.depthTest = false;
      selectedMoveHelper.renderOrder = 999;
      scene.add(selectedMoveHelper);
    };
    const handlePointerDown = (event) => {
      pointerStart = { x: event.clientX, y: event.clientY };
    };
    const handlePointerUp = (event) => {
      if (!pointerStart) return;
      const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
      if (moved > 8) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      if (!buildMode) {
        const hits = raycaster.intersectObjects(scene.children, true);
        const dogHit = hits.find((entry) => entry.object.userData.isDog);
        if (dogHit) {
          dogClickRef.current?.();
          return;
        }
        const hit = hits.find((entry) => entry.object.userData.layoutType);
        if (hit) {
          interactionRef.current?.(hit.object.userData.layoutType);
          return;
        }
        if (dog && !away && !departing) {
          const groundHit = raycaster.intersectObject(buildGround);
          if (groundHit.length) {
            if (dogFloor > 0 && !hasFloorSupport(groundHit[0].point.x, groundHit[0].point.z, dogFloor)) {
              buildFeedbackRef.current?.('No hay suelo por donde caminar.');
              return;
            }
            dogTarget.set(
              Math.max(-16, Math.min(16, groundHit[0].point.x)),
              0,
              Math.max(-13, Math.min(5, groundHit[0].point.z))
            );
            dogIsMoving = true;
          }
        }
        return;
      }

      if (!selectedTool) return;
      if (selectedTool === 'move') {
        const hits = raycaster.intersectObjects(scene.children, true);
        const itemHit = getActiveLayoutHit(hits);
        if (itemHit) {
          selectMoveItem(itemHit.object.userData.layoutId);
          return;
        }
        const groundHit = raycaster.intersectObject(buildGround);
        if (groundHit.length && selectedMoveItemId) {
          const movingItem = getLayoutItem(selectedMoveItemId);
          const gridSize = movingItem?.type === 'floorTile' ? 2 : 1;
          const x = Math.max(-17, Math.min(17, Math.round(groundHit[0].point.x / gridSize) * gridSize));
          const z = Math.max(-14, Math.min(5, Math.round(groundHit[0].point.z / gridSize) * gridSize));
          if (movingItem?.type === 'floorTile' && tileHasObjects(movingItem)) {
            buildFeedbackRef.current?.('Esa baldosa sostiene objetos. Muévelos primero.');
            return;
          }
          if (movingItem?.type !== 'floorTile' && !hasFloorSupport(x, z, movingItem?.level || 0)) {
            buildFeedbackRef.current?.('Primero coloca una baldosa debajo.');
            return;
          }
          handlerRef.current(layout.map((item) => (
            item.id === selectedMoveItemId ? { ...item, x, z } : item
          )));
          clearMoveSelection();
        }
        return;
      }

      if (selectedTool === 'paint') {
        const hits = raycaster.intersectObjects(scene.children, true);
        const hit = getActiveLayoutHit(hits);
        if (hit) {
          handlerRef.current(layout.map((item) => (
            item.id === hit.object.userData.layoutId ? { ...item, color: placementColor } : item
          )));
        }
        return;
      }

      if (selectedTool === 'rotate') {
        const hits = raycaster.intersectObjects(scene.children, true);
        const hit = getActiveLayoutHit(hits);
        if (hit) {
          const layoutId = hit.object.userData.layoutId;
          if (selectedMoveItemId !== layoutId) {
            selectMoveItem(layoutId);
            buildFeedbackRef.current?.('Objeto seleccionado. Tócalo otra vez para girarlo.');
            return;
          }
          handlerRef.current(layout.map((item) => (
            item.id === layoutId
              ? { ...item, rotation: ((item.rotation || 0) + Math.PI / 2) % (Math.PI * 2) }
              : item
          )));
          clearMoveSelection();
        }
        return;
      }

      if (selectedTool === 'resize') {
        const hits = raycaster.intersectObjects(scene.children, true);
        const hit = getActiveLayoutHit(hits);
        if (hit) {
          handlerRef.current(layout.map((item) => (
            item.id === hit.object.userData.layoutId
              ? { ...item, scale: (item.scale || 1) >= 1.5 ? 0.75 : (item.scale || 1) + 0.25 }
              : item
          )));
        }
        return;
      }

      if (selectedTool === 'duplicate') {
        const hits = raycaster.intersectObjects(scene.children, true);
        const hit = getActiveLayoutHit(hits);
        const source = hit && layout.find((item) => item.id === hit.object.userData.layoutId);
        if (source) {
          const duplicateX = Math.min(17, source.x + 1);
          const duplicateZ = Math.min(5, source.z + 1);
          if (source.type !== 'floorTile' && !hasFloorSupport(duplicateX, duplicateZ, source.level || 0)) {
            buildFeedbackRef.current?.('No hay baldosa para colocar la copia.');
            return;
          }
          handlerRef.current([...layout, {
            ...source,
            id: `${source.type}-${Date.now()}`,
            x: duplicateX,
            z: duplicateZ
          }]);
        }
        return;
      }

      if (selectedTool === 'delete') {
        const hits = raycaster.intersectObjects(scene.children, true);
        const hit = getActiveLayoutHit(hits);
        if (hit) {
          const target = getLayoutItem(hit.object.userData.layoutId);
          if (target?.type === 'floorTile' && tileHasObjects(target)) {
            buildFeedbackRef.current?.('No puedes borrar una baldosa que sostiene objetos.');
            return;
          }
          handlerRef.current(layout.filter((item) => item.id !== hit.object.userData.layoutId));
        }
        return;
      }

      const hit = raycaster.intersectObject(buildGround);
      if (!hit.length) return;
      const gridSize = selectedTool === 'floorTile' ? 2 : 1;
      const x = Math.max(-17, Math.min(17, Math.round(hit[0].point.x / gridSize) * gridSize));
      const z = Math.max(-14, Math.min(5, Math.round(hit[0].point.z / gridSize) * gridSize));
      if (selectedTool === 'stairs' && activeFloor !== 0) {
        buildFeedbackRef.current?.('Las escaleras se construyen desde el piso 1.');
        return;
      }
      if (selectedTool !== 'floorTile' && activeFloor > 0 && !hasFloorSupport(x, z, activeFloor)) {
        buildFeedbackRef.current?.('Primero coloca una baldosa debajo.');
        return;
      }
      const nextItem = {
        id: `${selectedTool}-${Date.now()}`,
        type: selectedTool,
        x,
        z,
        rotation,
        level: activeFloor || 0,
        color: placementColor
      };
      handlerRef.current([...layout, nextItem]);
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    const clock = new THREE.Clock();
    let frame;
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      const motion = animationRef.current;
      if (dog && autonomous && !departing && motion === '' && elapsed > nextAutonomyAt && !dogIsMoving) {
        const walkableTiles = layout.filter((item) => item.type === 'floorTile' && (item.level || 0) === (dogFloor || 0));
        const destinationTile = dogFloor > 0 && walkableTiles.length
          ? walkableTiles[Math.floor(Math.random() * walkableTiles.length)]
          : null;
        dogTarget.set(
          destinationTile ? destinationTile.x : (Math.random() - .5) * 22,
          (dogFloor || 0) * 3.15,
          destinationTile ? destinationTile.z : (Math.random() - .5) * 14 - 3
        );
        dogIsMoving = dogFloor === 0 || Boolean(destinationTile);
        nextAutonomyAt = elapsed + 8 + Math.random() * 8;
      }
      const jump = motion === 'jump' ? Math.abs(Math.sin(elapsed * 7)) * 0.32 : 0;
      const shake = motion === 'shake' ? Math.sin(elapsed * 18) * 0.08 : 0;
      const sleepy = motion === 'sleep' ? -0.16 : 0;
      if (dog) {
        if (departing) {
          const walkProgress = Math.min(1, elapsed / 1.5);
          dog.position.x = THREE.MathUtils.lerp(0, 5, walkProgress);
          dog.position.z = THREE.MathUtils.lerp(0.4, 2.4, walkProgress);
          dog.rotation.y = -0.95;
        } else if (dogIsMoving || motion === 'walk') {
          const destination = motion === 'walk'
            ? new THREE.Vector3(dogTarget.x + Math.sin(elapsed * 2.4) * 1.4, 0, dogTarget.z + Math.cos(elapsed * 2.4) * 1.4)
            : dogTarget;
          const dx = destination.x - dog.position.x;
          const dz = destination.z - dog.position.z;
          const distance = Math.hypot(dx, dz);
          if (distance > 0.08) {
            const speed = Math.min(0.024, distance);
            dog.position.x += (dx / distance) * speed;
            dog.position.z += (dz / distance) * speed;
            const desiredRotation = Math.atan2(-dz, dx);
            const rotationDifference = Math.atan2(
              Math.sin(desiredRotation - dog.rotation.y),
              Math.cos(desiredRotation - dog.rotation.y)
            );
            dog.rotation.y += rotationDifference * 0.09;
          } else if (motion !== 'walk') {
            dogIsMoving = false;
          }
        }
        const isWalking = dogIsMoving || motion === 'walk' || departing;
        const walkingBob = isWalking ? Math.abs(Math.sin(elapsed * 6.5)) * 0.028 : 0;
        const eatingBob = motion === 'eat' ? Math.abs(Math.sin(elapsed * 8)) * 0.1 : 0;
        const baseDogHeight = departing ? 0 : (dogFloor || 0) * 3.15;
        dog.position.y = baseDogHeight + Math.sin(elapsed * (departing ? 9 : 2)) * (departing ? 0.04 : 0.018) + jump + sleepy + walkingBob;
        dog.rotation.z = shake + (motion === 'eat' ? Math.sin(elapsed * 8) * 0.07 : 0);
        dog.scale.y = motion === 'sleep' ? 0.72 : 1;
        dog.scale.x = motion === 'eat' ? 1 + eatingBob * 0.12 : 1;
        dogPositionRef.current.set(dog.position.x, baseDogHeight, dog.position.z);
        dog.children.forEach((child) => {
          if (!child.userData.isLeg) return;
          child.rotation.z = isWalking ? Math.sin(elapsed * 6.5 + child.userData.walkPhase) * 0.28 : 0;
        });
        const tail = dog.children.find((child) => child.userData.isTail);
        if (tail) tail.rotation.y = Math.sin(elapsed * 7) * 0.42;
      }
      if (car && departing && elapsed > 1.45) {
        const driveProgress = Math.min(1, (elapsed - 1.45) / 1.7);
        if (driveProgress < 0.42) {
          const drivewayProgress = driveProgress / 0.42;
          car.position.set(5.5, 0, THREE.MathUtils.lerp(2.2, 8.65, drivewayProgress));
          car.rotation.y = 0;
        } else if (driveProgress < 0.56) {
          const turnProgress = (driveProgress - 0.42) / 0.14;
          const easedTurn = turnProgress * turnProgress * (3 - 2 * turnProgress);
          car.position.x = THREE.MathUtils.lerp(5.5, 3.8, easedTurn);
          car.position.z = THREE.MathUtils.lerp(8.65, 9, easedTurn);
          car.rotation.y = THREE.MathUtils.lerp(0, -Math.PI / 2, easedTurn);
        } else {
          const roadProgress = (driveProgress - 0.56) / 0.44;
          car.position.set(THREE.MathUtils.lerp(3.8, -34, roadProgress), 0, 9);
          car.rotation.y = -Math.PI / 2;
        }
        if (dog) dog.visible = false;
      }
      neighborDogs.forEach((neighborDog, index) => {
        neighborDog.position.x += Math.sin(elapsed * .7 + index) * .002;
        neighborDog.position.z += Math.cos(elapsed * .6 + index) * .002;
        const neighborTail = neighborDog.children.find((child) => child.userData.isTail);
        if (neighborTail) neighborTail.rotation.y = Math.sin(elapsed * 5 + index) * .35;
      });
      const weatherPoints = scene.children.find((child) => child.userData.isWeather);
      if (weatherPoints) {
        const positions = weatherPoints.geometry.attributes.position;
        for (let index = 0; index < positions.count; index += 1) {
          const nextY = positions.getY(index) - (world.weather === 'snow' ? .015 : .08);
          positions.setY(index, nextY < 0 ? 16 : nextY);
        }
        positions.needsUpdate = true;
      }
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    const resize = new ResizeObserver(() => {
      const nextWidth = mount.clientWidth;
      const nextHeight = mount.clientHeight;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    });
    resize.observe(mount);

    return () => {
      cameraStateRef.current = {
        position: camera.position.clone(),
        target: controls.target.clone()
      };
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      clearMoveSelection();
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
      });
      mount.removeChild(renderer.domElement);
    };
  }, [activeFloor, appearance, autonomous, away, buildMode, carAway, colors, departing, dogFloor, garden, landscapeMode, layout, outfit, placementColor, resetCameraKey, room, rotation, selectedTool, vehicle, world?.simHour, world?.time, world?.weather]);

  return <div className={`house-3d ${buildMode ? 'is-building' : ''}`} ref={mountRef} />;
}

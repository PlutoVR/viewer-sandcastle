import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  TextureLoader,
  SphereGeometry,
  PMREMGenerator,
  Clock,
  EquirectangularReflectionMapping,
  RepeatWrapping,
  BoxGeometry,
  LoadingManager,
} from "three";
import Renderer from "../engine/renderer";
import State from "../engine/state";
import PMAEventHandler from "pluto-mae";

const photo1 = require("./assets/images/photo1.jpg");
const photo2 = require("./assets/images/photo2.jpg");
const photo3 = require("./assets/images/photo3.jpg");
const photo4 = require("./assets/images/photo4.jpg");
const photo5 = require("./assets/images/photo5.jpg");

class UI {
  constructor(scene) {
    this.pmaEventHandler = new PMAEventHandler();
    this.scene = scene;
    this.clock = new Clock();
    this.createGrid();
    this.createLoadManager();
    this.createOrbContainer();
    this.orbRadius = 0.15;
  }

  createLoadManager() {
    this.loadManager = new LoadingManager();
    this.loader = new TextureLoader(this.loadManager);

    this.loadManager.onStart = (url, itemsLoaded, itemsTotal) => {};
    this.loadManager.onLoad = () => {
      console.log("360 Viewer Asset Loading complete!");
    };
    this.loadManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      switch (itemsLoaded) {
        case 1:
          this.clearGrid();
          this.createSkybox();
          break;
        case 3:
          this.createSelectionOrbs();
          break;
        default:
          break;
      }
    };
    this.loadManager.onError = url => {
      console.error("There was an error loading " + url);
    };

    this.photos = [
      this.loader.load(photo1),
      this.loader.load(photo2),
      this.loader.load(photo3),
      this.loader.load(photo4),
      this.loader.load(photo5),
    ];

    this.photos.forEach(photo => {
      photo.mapping = EquirectangularReflectionMapping;
      photo.wrapS = photo.wrapT = RepeatWrapping;
    });
  }

  clearGrid() {
    this.grid.visible = false;
  }

  selectPhoto(data) {
    State.currentPhotoIndex = data.photoIndex;
    this.scene.background = this.photos[data.photoIndex];
    this.selectionOrb1.material.map = this.photos[
      this.retrieveNextPhotoIndex(1)
    ];
    this.selectionOrb2.material.map = this.photos[
      this.retrieveNextPhotoIndex(-1)
    ];
  }

  createSkybox() {
    const pmremGenerator = new PMREMGenerator(Renderer);
    pmremGenerator.compileEquirectangularShader();
    let photoTexture = this.photos[State.currentPhotoIndex];
    this.scene.background = photoTexture;
  }

  createOrbContainer() {
    this.orbContainer = new Object3D();
    this.orbContainer.name = "OrbContainer";
    this.scene.add(this.orbContainer);
    this.setInitPosition();
  }

  setInitPosition() {
    if (State.initialPosition) {
      this.orbContainer.position.copy(State.initialPosition);
    } else {
      let initialPosition = this.pmaEventHandler.getAppState().initialPosition;
      if (initialPosition) {
        State.eventHandler.dispatchEvent("setinitposition", initialPosition);
        this.orbContainer.position.copy(initialPosition);
      } else {
        console.warn(
          "no initial position provided, defaulting to Vector3().Zero"
        );
      }
    }
  }

  createSelectionOrbs() {
    let photoTexture1 = this.photos[this.retrieveNextPhotoIndex(1)];
    let photoTexture2 = this.photos[this.retrieveNextPhotoIndex(-1)];

    let geometry = new SphereGeometry(this.orbRadius, 20, 20);
    let orbMaterial1 = new MeshBasicMaterial({
      color: 0xbbbbbb,
      transparent: true,
    });
    let orbMaterial2 = new MeshBasicMaterial({
      color: 0xbbbbbb,
      transparent: true,
    });
    let sphere = new Mesh(geometry, orbMaterial1);
    sphere.position.setY(1.2);
    sphere.position.setZ(-1);
    this.selectionOrb1 = sphere.clone();
    this.selectionOrb1.position.setX(-0.5);
    this.selectionOrb1.material.map = photoTexture1;
    this.selectionOrb1.Update = () => {
      this.selectionOrb1.position.y =
        -Math.sin(this.clock.getElapsedTime() * 2) / 40;
      this.selectionOrb1.material.map.offset.x += 0.0005;
    };
    this.selectionOrb1.inc = 1;
    this.orbContainer.add(this.selectionOrb1);

    this.selectionOrb2 = sphere.clone();
    this.selectionOrb2.material = orbMaterial2;
    this.selectionOrb2.material.map = photoTexture2;
    this.selectionOrb2.position.setX(0.5);
    this.selectionOrb2.Update = () => {
      this.selectionOrb2.position.y =
        Math.sin(this.clock.getElapsedTime() * 2) / 40;
      this.selectionOrb2.material.map.offset.x += 0.0005;
    };
    this.selectionOrb2.inc = -1;
    this.orbContainer.add(this.selectionOrb2);
  }

  createGrid() {
    const gridGeo = new BoxGeometry(9, 9, 9, 10, 10, 10);
    const gridMat = new MeshBasicMaterial({ wireframe: true, color: 0xd9cd2b });
    this.grid = new Mesh(gridGeo, gridMat);
    this.grid.position.y += 4.5;
    this.scene.add(this.grid);
  }

  retrieveNextPhotoIndex(inc) {
    if (State.currentPhotoIndex + inc < 0) {
      return this.photos.length - 1;
    } else if (State.currentPhotoIndex + inc > this.photos.length - 1) {
      return 0;
    } else {
      return State.currentPhotoIndex + inc;
    }
  }
}
export default UI;

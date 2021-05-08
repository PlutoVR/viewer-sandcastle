import State from "./state";
import { PerspectiveCamera, AudioListener } from "three";
import EngineEditorCamera from "./util/cameracontrols/engineeditorcamera";
import SessionHandler from "./util/webxr/sessionhandler";
import Renderer from "./renderer";
import XRInput from "./xrinput";

// editor camera + audiolistener
export const Camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
const loadScene = scene => {
  scene.add(new EngineEditorCamera(Camera, Renderer.domElement));
  Camera.audioListener = new AudioListener();
  Camera.add(Camera.audioListener);
  scene.add(Camera);

  // main app render loop
  Renderer.setAnimationLoop(() => {
    // RENDERING
    Renderer.render(scene, Camera);
    // INPUT
    if (State.isXRSession) XRInput.Update();

    // TRAVERSE UPDATE METHODS IN SCENE OBJECTS
    scene.traverse(obj => {
      typeof obj.Update === "function" ? obj.Update() : false;
    });
  });

  // DOM append
  document.querySelector(".app").appendChild(Renderer.domElement);
  // WebXR button
  document.querySelector(".app").appendChild(new SessionHandler());

  window.addEventListener("resize", () => {
    Camera.aspect = window.innerWidth / window.innerHeight;
    Camera.updateProjectionMatrix();
    Renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

export default loadScene;

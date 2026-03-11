// visualizer/index.js — Public API for the visualizer module
import { initPipeline, updatePipeline, drawJoinLines, updateDataFlow, stopAutoplay, initTimeline, resetTimeline, getTimelineSteps, getAnimatedSteps, clearDfAnimTimers, timelineState } from './animations.js';

export {
  initPipeline,
  updatePipeline,
  drawJoinLines,
  updateDataFlow,
  stopAutoplay,
  initTimeline,
  resetTimeline,
  getTimelineSteps,
  getAnimatedSteps,
  clearDfAnimTimers,
  timelineState
};

export function initVisualizer() {
  initPipeline();
  initTimeline();
}

export function reset() {
  resetTimeline();
  clearDfAnimTimers();
  const container = document.getElementById('dataFlow');
  if (container) container.innerHTML = '';
}

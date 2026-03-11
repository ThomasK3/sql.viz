// main.js — Entry point, imports and initializes all modules
import { initSQLite } from './engine.js';
import {
  initEditor, initExamples, initDict, updateEditor,
  executeQuery, executeInstant, toggleExamples, toggleDict,
  toggleFullscreen, highlightSQL
} from './editor.js';
import {
  initTasks, toggleTasksPanel, toggleTasksDocked, tasksOverlayClick,
  showTasksPasteModal, hideTasksPasteModal, loadTasksFromPaste,
  toggleTasksChapter, selectTask, toggleTaskSolved
} from './tasks.js';
import { initVisualizer, drawJoinLines } from './visualizer/index.js';
import { EXAMPLES } from './editor.js';

// Wire up all onclick handlers from HTML (replacing inline onclick attributes)
function wireEventHandlers() {
  // Header buttons
  document.getElementById('btnDict')?.addEventListener('click', toggleDict);
  document.getElementById('btnTasks')?.addEventListener('click', toggleTasksPanel);

  // Editor toolbar
  document.getElementById('btnExamples')?.addEventListener('click', toggleExamples);
  document.getElementById('btnRun')?.addEventListener('click', executeQuery);

  // Fullscreen buttons
  document.querySelectorAll('.section-fullscreen-btn').forEach(btn => {
    const section = btn.closest('[id]');
    if (section) {
      btn.addEventListener('click', () => toggleFullscreen(section.id));
    }
  });

  // Challenge panel (commented out in HTML, but wire up just in case)
  document.querySelector('.challenge-close')?.addEventListener('click', () => {
    document.getElementById('challengePanel').style.display = 'none';
    const chBtn = document.getElementById('btnChallenge');
    if (chBtn) chBtn.classList.remove('active');
  });
  document.getElementById('chPrev')?.addEventListener('click', () => {
    // Challenge navigation handled by editor module
  });
  document.getElementById('chNext')?.addEventListener('click', () => {
    // Challenge navigation handled by editor module
  });

  // Tasks panel
  document.getElementById('tasksOverlay')?.addEventListener('click', tasksOverlayClick);
  document.getElementById('tasksPinBtn')?.addEventListener('click', toggleTasksDocked);
  document.querySelector('#tasksPanel .tasks-close-btn')?.addEventListener('click', toggleTasksPanel);

  // Paste modal
  document.querySelector('#pasteModalOverlay .btn:not(.btn-primary)')?.addEventListener('click', hideTasksPasteModal);
  document.querySelector('#pasteModalOverlay .btn-primary')?.addEventListener('click', loadTasksFromPaste);
  document.querySelector('#pasteModalOverlay .paste-modal-header button')?.addEventListener('click', hideTasksPasteModal);

  // Close flow tooltips on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.flow-step').forEach(s => s.classList.remove('show-tip'));
  });

  // Close examples menu on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.examples-dropdown')) {
      document.getElementById('examplesMenu')?.classList.remove('show');
    }
  });

  // Escape key closes fullscreen
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const fs = document.querySelector('.section-fullscreen');
      if (fs) toggleFullscreen(fs.id);
    }
  });

  // Window resize
  window.addEventListener('resize', () => {
    updateEditor();
    drawJoinLines(window.__lastLinks || []);
  });

  // Tasks panel uses event delegation for dynamic content
  document.getElementById('tasksBody')?.addEventListener('click', (e) => {
    // Chapter header toggle
    const chapterHeader = e.target.closest('.tasks-chapter-header');
    if (chapterHeader) {
      toggleTasksChapter(chapterHeader);
      return;
    }
    // Task check toggle
    const checkEl = e.target.closest('.tasks-task-check');
    if (checkEl) {
      e.stopPropagation();
      const taskEl = checkEl.closest('.tasks-task');
      if (taskEl) toggleTaskSolved(parseInt(taskEl.dataset.taskid));
      return;
    }
    // Task selection
    const taskEl = e.target.closest('.tasks-task');
    if (taskEl) {
      selectTask(parseInt(taskEl.dataset.taskid));
    }
  });
}

// Initialize application
(async () => {
  // Init UI modules
  initVisualizer();
  initExamples();
  initDict();
  initEditor();

  // Wire up event handlers (replacing inline onclick)
  wireEventHandlers();

  // Detect macOS and update shortcut labels
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutLabel = isMac ? '⌘↵' : 'Ctrl+↵';
  const shortcutText = isMac ? '⌘+Enter' : 'Ctrl+Enter';
  const btnRun = document.getElementById('btnRun');
  if (btnRun) btnRun.innerHTML = '▶ Spustit <kbd>' + shortcutLabel + '</kbd>';
  const rp = document.getElementById('resultsPlaceholder');
  if (rp) rp.innerHTML = 'Napiš SQL dotaz a stiskni <kbd>' + shortcutText + '</kbd> pro spuštění';

  // Load SQLite WASM engine
  try {
    await initSQLite();
  } catch(e) {
    console.error('sql.js init failed:', e);
  }

  // Load default tasks (after initSQLite — task solutions need SQLite)
  initTasks();

  // Load initial example (JOIN ON)
  executeInstant(EXAMPLES[4].sql);
})();

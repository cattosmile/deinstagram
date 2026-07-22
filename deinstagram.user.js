// ==UserScript==
// @name         Deinstagram
// @namespace    https://github.com/cattosmile/deinstagram
// @version      1.0.0
// @description  Unsend your own messages from selected Instagram chats.
// @match        https://www.instagram.com/direct/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const CONFIG = Object.freeze({
    minDelayMs: 1500,
    maxDelayMs: 2000,
    cooldownEvery: 25,
    cooldownMs: 15000,
    dialogWidth: 400,
    pageSize: 20,
    maxPages: 500,
    inboxLoadMaxSteps: 200,
    inboxLoadPollMs: 200,
    inboxLoadWaitMs: 2400,
    queryDocId: '28395443243391552',
    paginationDocId: '27502152406082940',
    unsendDocId: '26948700068153789',
  });

  const NATIVE_TRASH_ICON = `
    <svg aria-hidden="true" fill="currentColor" height="23" viewBox="0 0 24 24" width="23">
      <line fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="2.876" x2="21.124" y1="4.727" y2="4.727"></line>
      <path d="M8.818 4.727v-1.59A1.136 1.136 0 0 1 9.954 2h4.092a1.136 1.136 0 0 1 1.136 1.136v1.591" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
      <path d="m4.377 4.727 1.987 15.88A1.59 1.59 0 0 0 7.942 22h8.116a1.59 1.59 0 0 0 1.578-1.393l1.987-15.88" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
    </svg>
  `;

  const INSTAGRAM_UI_STYLES = `
    #uninstagram-dialog {
      position: fixed;
      inset: auto;
      width: ${CONFIG.dialogWidth}px;
      max-width: calc(100vw - 16px);
      max-height: calc(100vh - 16px);
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 24px;
      box-sizing: border-box;
      overflow: hidden;
      z-index: 2147483647;
      color: rgb(var(--ig-primary-text, 0, 0, 0));
      background: rgb(var(--ig-elevated-background, 255, 255, 255));
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 18px;
    }

    #uninstagram-dialog[open] {
      display: flex;
      flex-direction: column;
    }

    #uninstagram-dialog,
    #uninstagram-dialog * {
      box-sizing: border-box;
    }

    #uninstagram-dialog button,
    #uninstagram-dialog input,
    #uninstagram-dialog select {
      font: inherit;
    }

    #uninstagram-dialog .uninstagram-header {
      display: flex;
      flex: 0 0 43px;
      align-items: center;
      justify-content: center;
      min-height: 43px;
      padding: 0 16px;
      border-bottom: 1px solid rgb(var(--ig-separator, 219, 219, 219));
    }

    #uninstagram-dialog .uninstagram-title {
      margin: 0;
      color: rgb(var(--ig-primary-text, 0, 0, 0));
      font-size: 16px;
      font-weight: 600;
      line-height: 20px;
      text-align: center;
    }

    #uninstagram-dialog .uninstagram-body {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      gap: 16px;
      min-height: 0;
      padding: 16px;
      overflow-y: auto;
      scrollbar-color: rgb(var(--ig-tertiary-text, 115, 115, 115)) transparent;
      scrollbar-width: thin;
    }

    #uninstagram-dialog .uninstagram-context {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-height: 58px;
    }

    #uninstagram-dialog .uninstagram-target,
    #uninstagram-dialog .uninstagram-status,
    #uninstagram-dialog .uninstagram-progress {
      margin: 0;
    }

    #uninstagram-dialog .uninstagram-target {
      color: rgb(var(--ig-primary-text, 0, 0, 0));
      font-weight: 600;
    }

    #uninstagram-dialog .uninstagram-status {
      color: rgb(var(--ig-secondary-text, 115, 115, 115));
    }

    #uninstagram-dialog .uninstagram-progress {
      padding: 12px;
      border-radius: 8px;
      color: rgb(var(--ig-primary-text, 0, 0, 0));
      background: rgb(var(--ig-secondary-background, 250, 250, 250));
      font-weight: 600;
    }

    #uninstagram-dialog .uninstagram-fields {
      min-width: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }

    #uninstagram-dialog .uninstagram-fields legend {
      margin: 0 0 12px;
      padding: 0;
      color: rgb(var(--ig-primary-text, 0, 0, 0));
      font-weight: 600;
    }

    #uninstagram-dialog .uninstagram-field-grid {
      display: grid;
      gap: 12px;
    }

    #uninstagram-dialog .uninstagram-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
      color: rgb(var(--ig-primary-text, 0, 0, 0));
      font-weight: 600;
    }

    #uninstagram-dialog .uninstagram-field > span {
      font-size: 14px !important;
      line-height: 18px !important;
    }

    #uninstagram-dialog .uninstagram-field select,
    #uninstagram-dialog .uninstagram-field input {
      width: 100%;
      height: 40px;
      margin: 0;
      padding: 0 12px;
      border: 1px solid rgb(var(--ig-separator, 219, 219, 219));
      border-radius: 8px;
      outline: 0;
      color: rgb(var(--ig-primary-text, 0, 0, 0));
      background: rgb(var(--ig-secondary-background, 250, 250, 250));
      font-size: 14px !important;
      font-weight: 400;
      line-height: 18px !important;
    }

    #uninstagram-dialog .uninstagram-select-control {
      position: relative;
    }

    #uninstagram-dialog .uninstagram-select-control select {
      padding-right: 52px;
      appearance: none;
      -webkit-appearance: none;
    }

    #uninstagram-dialog .uninstagram-select-chevron {
      position: absolute;
      top: 50%;
      right: 14px;
      width: 16px;
      height: 16px;
      color: rgb(var(--ig-primary-text, 0, 0, 0));
      pointer-events: none;
      transform: translateY(-50%);
    }

    #uninstagram-dialog .uninstagram-select-control select:disabled + .uninstagram-select-chevron {
      color: rgb(var(--ig-secondary-text, 115, 115, 115));
      opacity: 0.65;
    }

    #uninstagram-dialog .uninstagram-native-state {
      display: none !important;
    }

    #uninstagram-dialog .uninstagram-thread-picker,
    #uninstagram-dialog .uninstagram-range-picker {
      position: relative;
      z-index: 2;
    }

    #uninstagram-dialog .uninstagram-picker-expanded {
      z-index: 4;
    }

    #uninstagram-dialog .uninstagram-thread-picker-button {
      display: flex;
      width: 100%;
      height: 40px;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 0;
      padding: 0 14px 0 12px;
      border: 1px solid rgb(var(--ig-separator, 219, 219, 219));
      border-radius: 8px;
      color: rgb(var(--ig-primary-text, 0, 0, 0));
      background: rgb(var(--ig-secondary-background, 250, 250, 250));
      font-weight: 400;
      text-align: left;
      cursor: pointer;
    }

    #uninstagram-dialog .uninstagram-thread-picker-summary {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #uninstagram-dialog .uninstagram-thread-picker-button .uninstagram-select-chevron {
      position: static;
      flex: 0 0 auto;
      transform: none;
    }

    #uninstagram-dialog .uninstagram-thread-options,
    #uninstagram-dialog .uninstagram-range-options {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 3;
      display: grid;
      width: 0;
      max-height: 192px;
      padding: 4px;
      border: 1px solid rgb(var(--ig-separator, 219, 219, 219));
      border-radius: 8px;
      overflow-y: auto;
      background: rgb(var(--ig-elevated-background, 255, 255, 255));
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    #uninstagram-dialog .uninstagram-thread-options::-webkit-scrollbar,
    #uninstagram-dialog .uninstagram-range-options::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }

    #uninstagram-dialog .uninstagram-thread-options[hidden],
    #uninstagram-dialog .uninstagram-range-options[hidden] {
      display: none;
    }

    #uninstagram-dialog .uninstagram-thread-option {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 10px;
      padding: 9px 8px;
      border-radius: 6px;
      font-weight: 400;
      cursor: pointer;
    }

    #uninstagram-dialog .uninstagram-thread-option:hover {
      background: rgb(var(--ig-highlight-background, 239, 239, 239));
    }

    #uninstagram-dialog .uninstagram-thread-option-all {
      position: sticky;
      top: 0;
      z-index: 1;
      margin-bottom: 4px;
      border-bottom: 1px solid rgb(var(--ig-separator, 219, 219, 219));
      border-radius: 6px 6px 0 0;
      background: rgb(var(--ig-elevated-background, 255, 255, 255));
      font-weight: 600;
    }

    #uninstagram-dialog .uninstagram-thread-option-all::before {
      position: absolute;
      top: -8px;
      right: -4px;
      left: -4px;
      height: 8px;
      background: rgb(var(--ig-elevated-background, 255, 255, 255));
      content: "";
      pointer-events: none;
    }

    #uninstagram-dialog .uninstagram-thread-option input {
      width: 18px;
      height: 18px;
      flex: 0 0 18px;
      margin: 0;
      padding: 0;
      accent-color: rgb(var(--ig-primary-button, 0, 149, 246));
    }

    #uninstagram-dialog .uninstagram-thread-option span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #uninstagram-dialog .uninstagram-thread-empty {
      margin: 0;
      padding: 9px 8px;
      color: rgb(var(--ig-secondary-text, 115, 115, 115));
      font-weight: 400;
    }

    #uninstagram-dialog .uninstagram-field select:focus-visible,
    #uninstagram-dialog .uninstagram-field input:focus-visible,
    #uninstagram-dialog .uninstagram-action:focus-visible {
      outline: 2px solid rgb(var(--ig-primary-button, 0, 149, 246));
      outline-offset: 2px;
    }

    #uninstagram-dialog:focus,
    #uninstagram-dialog:focus-visible,
    #uninstagram-dialog .uninstagram-thread-picker-button:focus,
    #uninstagram-dialog .uninstagram-thread-picker-button:focus-visible {
      outline: none !important;
    }

    #uninstagram-dialog .uninstagram-thread-picker-button:focus,
    #uninstagram-dialog .uninstagram-thread-picker-button:focus-visible {
      box-shadow: none !important;
    }

    #uninstagram-dialog .uninstagram-field select:disabled,
    #uninstagram-dialog .uninstagram-field input:disabled,
    #uninstagram-dialog .uninstagram-thread-picker-button:disabled {
      color: rgb(var(--ig-secondary-text, 115, 115, 115));
      cursor: default;
      opacity: 0.65;
    }

    #uninstagram-dialog .uninstagram-actions {
      display: flex;
      flex: 0 0 auto;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid rgb(var(--ig-separator, 219, 219, 219));
      background: rgb(var(--ig-elevated-background, 255, 255, 255));
    }

    #uninstagram-dialog .uninstagram-action {
      display: inline-flex;
      flex: 1 1 0;
      align-items: center;
      justify-content: center;
      min-width: 0;
      height: 32px;
      margin: 0;
      padding: 7px 16px;
      border: 0;
      border-radius: 8px;
      color: rgb(255, 255, 255);
      background: rgb(var(--ig-primary-button, 0, 149, 246));
      font-size: 14px;
      font-weight: 600;
      line-height: 18px;
      text-align: center;
      white-space: nowrap;
      cursor: pointer;
    }

    #uninstagram-dialog .uninstagram-action:hover {
      background: rgb(var(--ig-primary-button-hover, 24, 119, 242));
    }

    #uninstagram-dialog .uninstagram-action[data-tone="danger"] {
      background: rgb(var(--ig-error-or-destructive, 237, 73, 86));
    }

    #uninstagram-dialog .uninstagram-action[data-tone="secondary"] {
      color: rgb(var(--ig-primary-text, 0, 0, 0));
      background: rgb(var(--ig-secondary-background, 239, 239, 239));
    }

    #uninstagram-dialog .uninstagram-action[data-tone="secondary"]:hover {
      background: rgb(var(--ig-secondary-button-hover, 219, 219, 219));
    }

    #uninstagram-dialog .uninstagram-action:disabled,
    #uninstagram-dialog .uninstagram-action:disabled:hover {
      color: rgb(var(--ig-secondary-text, 115, 115, 115));
      background: rgb(var(--ig-secondary-background, 239, 239, 239));
      cursor: default;
    }

    .uninstagram-toggle-host {
      display: flex !important;
      align-items: center !important;
    }

    .uninstagram-toggle-host > [role="button"] {
      width: auto !important;
      min-width: 0 !important;
      flex: 1 1 0 !important;
    }
  `;

  const originalFetch = window.fetch.bind(window);
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  const state = {
    requestTemplate: null,
    thread: null,
    threadRouteId: null,
    availableThreads: new Map(),
    threadOrder: [],
    threadSearchQuery: '',
    selectedThreadIds: new Set(),
    selectionTouched: false,
    selectAllActive: false,
    loadingChats: false,
    allChatsLoaded: false,
    chatLoadGeneration: 0,
    activeRouteId: null,
    activeChatLabel: null,
    activeTargetIndex: 0,
    targetCount: 0,
    deleted: 0,
    failed: 0,
    chatFailures: 0,
    processed: 0,
    lastCooldownProcessed: 0,
    running: false,
    paused: false,
    stopped: false,
    cancelHover: false,
    confirmArmed: false,
    confirmationSelectionKey: null,
    requestNumber: 0,
    dialog: null,
    dialogRouteId: null,
    reopenDialogOnReturn: false,
  };

  function currentRouteId() {
    return location.pathname.match(/^\/direct\/t\/([^/]+)/)?.[1] ?? null;
  }

  function currentRouteKey() {
    return currentRouteId() ?? (location.pathname.startsWith('/direct/inbox') ? 'inbox' : null);
  }

  function parseRequestBody(body) {
    if (body instanceof URLSearchParams) return new URLSearchParams(body);
    if (typeof body === 'string') return new URLSearchParams(body);
    return null;
  }

  function getThreadFromDetail(json) {
    return json?.data?.get_slide_thread_nullable?.as_ig_direct_thread ?? null;
  }

  function getThreadFromPagination(json) {
    return json?.data?.fetch__SlideThread?.as_ig_direct_thread ?? null;
  }

  function threadMatchesRoute(thread, routeId) {
    if (!thread || !routeId) return false;
    return [thread.thread_key, thread.thread_fbid, thread.id, thread.thread_id]
      .filter(Boolean)
      .map(String)
      .includes(String(routeId));
  }

  function isCurrentThread(thread, requestedRouteId) {
    const routeId = currentRouteId();
    return Boolean(
      routeId &&
      String(requestedRouteId) === String(routeId) &&
      threadMatchesRoute(thread, routeId)
    );
  }

  function captureGraphql(body, responseJson) {
    const params = parseRequestBody(body);
    if (!params) return;

    const friendlyName = params.get('fb_api_req_friendly_name');
    if (friendlyName !== 'IGDThreadDetailQuery') return;

    let variables;
    try {
      variables = JSON.parse(params.get('variables') || '{}');
    } catch {
      return;
    }

    const requestedRouteId = variables.thread_fbid;
    const thread = getThreadFromDetail(responseJson);
    if (!threadMatchesRoute(thread, requestedRouteId)) return;

    state.requestTemplate = new URLSearchParams(params);
    captureAvailableThread(thread, requestedRouteId);

    if (!isCurrentThread(thread, requestedRouteId)) {
      if (!state.running) setIdleReadyStatus();
      return;
    }

    state.thread = thread;
    state.threadRouteId = String(requestedRouteId);
    if (!state.running && (!state.dialogRouteId || state.dialogRouteId === currentRouteKey())) {
      setTargetLabel();
      setIdleReadyStatus();
    }
  }

  window.fetch = async function patchedFetch(input, init) {
    const response = await originalFetch(input, init);
    const url = typeof input === 'string' ? input : input?.url;
    if (url?.includes('/api/graphql')) {
      const body = init?.body;
      response.clone().json().then((json) => captureGraphql(body, json)).catch(() => {});
    }
    return response;
  };

  XMLHttpRequest.prototype.open = function patchedOpen(method, url) {
    this.__uninstagramUrl = String(url);
    return originalXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function patchedSend(body) {
    if (this.__uninstagramUrl?.includes('/api/graphql')) {
      this.addEventListener('load', () => {
        try {
          captureGraphql(body, JSON.parse(this.responseText));
        } catch {
          // Not every GraphQL response is JSON.
        }
      }, { once: true });
    }
    return originalXhrSend.apply(this, arguments);
  };

  function chatLabel(thread) {
    const viewerFbid = thread?.viewer?.interop_messaging_user_fbid;
    const participants = (thread?.users ?? [])
      .filter((user) => String(user?.interop_messaging_user_fbid ?? '') !== String(viewerFbid ?? ''))
      .filter((user, index, users) => {
        const key = user?.interop_messaging_user_fbid ?? user?.username;
        return key && users.findIndex((candidate) => (
          candidate?.interop_messaging_user_fbid ?? candidate?.username
        ) === key) === index;
      });
    const title = typeof thread?.thread_title === 'string' ? thread.thread_title.trim() : '';
    const threadType = String(thread?.thread_type ?? '').toUpperCase();
    const isGroup = Boolean(
      thread?.is_group_thread ||
      threadType.includes('GROUP') ||
      participants.length > 1
    );

    if (isGroup && title) return title;
    if (isGroup && participants.length > 0) {
      const visibleParticipants = participants.slice(0, 3).map((user) => (
        user.username ? user.username : user.full_name
      )).filter(Boolean);
      const remaining = participants.length - visibleParticipants.length;
      if (visibleParticipants.length > 0) {
        return `${visibleParticipants.join(', ')}${remaining > 0 ? ` +${remaining}` : ''}`;
      }
    }

    const peerUsername = participants[0]?.username;
    if (peerUsername) return peerUsername;
    return title || 'this chat';
  }

  function threadAliases(thread, requestedRouteId) {
    return new Set([
      requestedRouteId,
      thread?.thread_fbid,
      thread?.thread_key,
      thread?.id,
      thread?.thread_id,
    ].filter(Boolean).map(String));
  }

  function captureAvailableThread(thread, requestedRouteId) {
    const aliases = threadAliases(thread, requestedRouteId);
    const existingTarget = Array.from(state.availableThreads.values()).find((target) => (
      Array.from(target.aliases ?? []).some((alias) => aliases.has(alias))
    ));
    const routeId = String(thread?.thread_fbid ?? existingTarget?.routeId ?? requestedRouteId);
    const wasSelected = Boolean(existingTarget && state.selectedThreadIds.has(existingTarget.routeId));
    if (existingTarget && existingTarget.routeId !== routeId) {
      state.availableThreads.delete(existingTarget.routeId);
      state.selectedThreadIds.delete(existingTarget.routeId);
    }

    state.availableThreads.set(routeId, {
      routeId,
      label: chatLabel(thread),
      thread,
      aliases: new Set([...(existingTarget?.aliases ?? []), ...aliases]),
    });

    if (wasSelected || state.selectAllActive) state.selectedThreadIds.add(routeId);

    rememberThreadOrderFromDom();
    renderThreadOptions();
    setTargetLabel();
  }

  function orderedTargets() {
    const orderByRouteId = new Map(
      state.threadOrder.map((routeId, index) => [routeId, index]),
    );
    return Array.from(state.availableThreads.values())
      .map((target, insertionIndex) => {
        const orderIndex = Array.from(target.aliases ?? [target.routeId]).reduce(
          (lowestIndex, alias) => Math.min(
            lowestIndex,
            orderByRouteId.get(String(alias)) ?? Number.POSITIVE_INFINITY,
          ),
          Number.POSITIVE_INFINITY,
        );
        return { target, insertionIndex, orderIndex };
      })
      .sort((left, right) => (
        (left.orderIndex - right.orderIndex) ||
        (left.insertionIndex - right.insertionIndex)
      ))
      .map(({ target }) => target);
  }

  function selectedTargets() {
    return orderedTargets()
      .filter((target) => state.selectedThreadIds.has(target.routeId));
  }

  function selectedTargetsKey() {
    return selectedTargets().map((target) => target.routeId).join(',');
  }

  function updateThreadPickerSummary() {
    const summary = state.dialog?.querySelector('[data-role="thread-picker-summary"]');
    if (!summary) return;
    const targets = selectedTargets();
    if (targets.length === 0) summary.textContent = 'Select chats';
    else if (targets.length === 1) summary.textContent = targets[0].label;
    else if (targets.length === state.availableThreads.size) summary.textContent = 'All chats selected';
    else summary.textContent = `${targets.length} chats selected`;
  }

  function setThreadPickerExpanded(expanded) {
    const picker = state.dialog?.querySelector('[data-action="toggle-thread-picker"]');
    const options = state.dialog?.querySelector('[data-role="thread-options"]');
    if (!picker || !options) return;
    if (expanded) setRangePickerExpanded(false);
    if (!expanded && state.threadSearchQuery) {
      state.threadSearchQuery = '';
      renderThreadOptions();
    }
    options.hidden = !expanded;
    picker.setAttribute('aria-expanded', String(expanded));
    picker.parentElement?.classList.toggle('uninstagram-picker-expanded', expanded);
    if (expanded) positionThreadOptions();
  }

  function positionFloatingOptions(picker, options, maximumHeight, constrainToFooter = true) {
    const pickerRect = picker.getBoundingClientRect();
    const footerTop = state.dialog
      ?.querySelector('.uninstagram-actions')
      ?.getBoundingClientRect().top ?? window.innerHeight;
    const dialogBottom = state.dialog?.getBoundingClientRect().bottom ?? window.innerHeight;
    const boundaryBottom = constrainToFooter ? footerTop : dialogBottom;
    const availableHeight = Math.max(
      48,
      Math.min(window.innerHeight, boundaryBottom) - pickerRect.bottom - 14,
    );
    options.style.top = `${pickerRect.bottom + 6}px`;
    options.style.left = `${pickerRect.left}px`;
    options.style.width = `${pickerRect.width}px`;
    options.style.maxHeight = `${Math.min(maximumHeight, availableHeight)}px`;
  }

  function positionThreadOptions() {
    const picker = state.dialog?.querySelector('[data-action="toggle-thread-picker"]');
    const options = state.dialog?.querySelector('[data-role="thread-options"]');
    if (!picker || !options || options.hidden) return;
    positionFloatingOptions(picker, options, 192);
  }

  function setRangePickerExpanded(expanded) {
    const picker = state.dialog?.querySelector('[data-action="toggle-range-picker"]');
    const options = state.dialog?.querySelector('[data-role="range-options"]');
    if (!picker || !options) return;
    if (expanded) setThreadPickerExpanded(false);
    options.hidden = !expanded;
    picker.setAttribute('aria-expanded', String(expanded));
    picker.parentElement?.classList.toggle('uninstagram-picker-expanded', expanded);
    if (expanded) positionRangeOptions();
  }

  function positionRangeOptions() {
    const picker = state.dialog?.querySelector('[data-action="toggle-range-picker"]');
    const options = state.dialog?.querySelector('[data-role="range-options"]');
    if (!picker || !options || options.hidden) return;
    positionFloatingOptions(picker, options, 132, false);
  }

  function updateRangeSelectionControls() {
    const dateMode = state.dialog?.querySelector('[data-role="date-mode"]');
    const summary = state.dialog?.querySelector('[data-role="range-picker-summary"]');
    if (!dateMode || !summary) return;

    summary.textContent = dateMode.options[dateMode.selectedIndex]?.textContent ?? 'All messages';
    state.dialog.querySelectorAll('[data-role="range-options"] input').forEach((input) => {
      input.checked = input.value === dateMode.value;
    });
  }

  function handleRangeSelectionChange(event) {
    if (state.running) return;
    const dateMode = state.dialog?.querySelector('[data-role="date-mode"]');
    if (!dateMode) return;
    dateMode.value = event.target.value;
    dateMode.dispatchEvent(new Event('change', { bubbles: true }));
    setRangePickerExpanded(false);
  }

  function handleThreadSelectionChange(event) {
    if (state.running) return;
    const routeId = event.target.value;
    if (event.target.checked) state.selectedThreadIds.add(routeId);
    else state.selectedThreadIds.delete(routeId);
    state.threadSearchQuery = '';
    state.selectionTouched = true;
    state.selectAllActive = (
      state.availableThreads.size > 0 &&
      selectedTargets().length === state.availableThreads.size
    );
    resetStartConfirmation();
    renderThreadOptions();
    positionThreadOptions();
    setTargetLabel();
    setIdleReadyStatus();
  }

  function handleSelectAllChange(event) {
    if (state.running) return;
    state.selectedThreadIds.clear();
    if (event.target.checked) {
      for (const routeId of state.availableThreads.keys()) state.selectedThreadIds.add(routeId);
    }
    state.threadSearchQuery = '';
    state.selectionTouched = true;
    state.selectAllActive = event.target.checked;
    resetStartConfirmation();
    renderThreadOptions();
    positionThreadOptions();
    setTargetLabel();
    setIdleReadyStatus();
  }

  function handleThreadTypeahead(event) {
    const options = state.dialog?.querySelector('[data-role="thread-options"]');
    if (
      state.running ||
      !options ||
      options.hidden ||
      event.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) return;

    let nextQuery = state.threadSearchQuery;
    if (event.key === 'Backspace') {
      nextQuery = nextQuery.slice(0, -1);
    } else if (event.key.length === 1 && event.key.trim()) {
      nextQuery += event.key.toLocaleLowerCase();
    } else {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (nextQuery === state.threadSearchQuery) return;
    state.threadSearchQuery = nextQuery;
    renderThreadOptions();
    positionThreadOptions();
  }

  function updateThreadSelectionControls() {
    const list = state.dialog?.querySelector('[data-role="thread-options"]');
    if (!list) return;

    const targets = orderedTargets();
    const selectedCount = targets.filter((target) => (
      state.selectedThreadIds.has(target.routeId)
    )).length;
    const selectAllCheckbox = list.querySelector('[data-action="select-all-chats"]');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = targets.length > 0 && selectedCount === targets.length;
      selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < targets.length;
    }
    list.querySelectorAll('[data-thread-route-id]').forEach((checkbox) => {
      checkbox.checked = state.selectedThreadIds.has(checkbox.dataset.threadRouteId);
    });
    updateThreadPickerSummary();
  }

  function renderThreadOptions() {
    const list = state.dialog?.querySelector('[data-role="thread-options"]');
    const picker = state.dialog?.querySelector('[data-action="toggle-thread-picker"]');
    if (!list || !picker) return;

    list.replaceChildren();
    const targets = orderedTargets();
    const visibleTargets = state.threadSearchQuery
      ? targets.filter((target) => (
        target.label.toLocaleLowerCase().startsWith(state.threadSearchQuery)
      ))
      : targets;
    if (targets.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'uninstagram-thread-empty';
      empty.textContent = 'Waiting for Instagram to load your chats…';
      list.appendChild(empty);
    } else {
      const selectedCount = targets.filter((target) => (
        state.selectedThreadIds.has(target.routeId)
      )).length;
      const selectAllOption = document.createElement('label');
      selectAllOption.className = 'uninstagram-thread-option uninstagram-thread-option-all';

      const selectAllCheckbox = document.createElement('input');
      selectAllCheckbox.type = 'checkbox';
      selectAllCheckbox.dataset.action = 'select-all-chats';
      selectAllCheckbox.checked = selectedCount === targets.length;
      selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < targets.length;
      selectAllCheckbox.disabled = state.running;
      selectAllCheckbox.addEventListener('change', handleSelectAllChange);

      const selectAllLabel = document.createElement('span');
      selectAllLabel.textContent = 'Select all chats';
      selectAllOption.append(selectAllCheckbox, selectAllLabel);
      list.appendChild(selectAllOption);

      for (const target of visibleTargets) {
        const option = document.createElement('label');
        option.className = 'uninstagram-thread-option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = target.routeId;
        checkbox.dataset.threadRouteId = target.routeId;
        checkbox.checked = state.selectedThreadIds.has(target.routeId);
        checkbox.disabled = state.running;
        checkbox.addEventListener('change', handleThreadSelectionChange);

        const label = document.createElement('span');
        label.textContent = target.label;
        option.append(checkbox, label);
        list.appendChild(option);
      }
      if (visibleTargets.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'uninstagram-thread-empty';
        empty.textContent = 'No matching chats.';
        list.appendChild(empty);
      }
    }

    picker.disabled = state.running || targets.length === 0;
    updateThreadPickerSummary();
  }

  function findThreadListNavigation() {
    return document.querySelector('[role="navigation"][aria-label="Thread list"]') ??
      Array.from(document.querySelectorAll('[role="navigation"]')).find((navigation) => (
        navigation.querySelector('svg[aria-label="New message"]')
      )) ?? null;
  }

  function rememberThreadOrderFromDom(preferStart = false) {
    const threadList = findThreadListNavigation();
    if (!threadList) return false;

    const observedRouteIds = [];
    const observedRouteIdSet = new Set();
    for (const anchor of threadList.querySelectorAll('a[href]')) {
      let routeId = null;
      try {
        routeId = new URL(anchor.getAttribute('href'), location.origin)
          .pathname
          .match(/^\/direct\/t\/([^/]+)/)?.[1] ?? null;
      } catch {
        // Ignore malformed or non-HTTP links in Instagram's navigation.
      }
      if (!routeId || observedRouteIdSet.has(routeId)) continue;
      observedRouteIdSet.add(routeId);
      observedRouteIds.push(routeId);
    }
    if (observedRouteIds.length === 0) return false;

    const previousOrder = state.threadOrder;
    const firstOverlap = observedRouteIds.find((routeId) => previousOrder.includes(routeId));
    const remainingRouteIds = previousOrder.filter((routeId) => !observedRouteIdSet.has(routeId));
    let insertionIndex = remainingRouteIds.length;
    if (firstOverlap) {
      const overlapIndex = previousOrder.indexOf(firstOverlap);
      insertionIndex = previousOrder
        .slice(0, overlapIndex)
        .filter((routeId) => !observedRouteIdSet.has(routeId))
        .length;
    } else if (preferStart) {
      insertionIndex = 0;
    }

    const nextOrder = [
      ...remainingRouteIds.slice(0, insertionIndex),
      ...observedRouteIds,
      ...remainingRouteIds.slice(insertionIndex),
    ];
    const changed = (
      nextOrder.length !== previousOrder.length ||
      nextOrder.some((routeId, index) => routeId !== previousOrder[index])
    );
    if (changed) state.threadOrder = nextOrder;
    return changed;
  }

  function findInboxThreadScroller() {
    const threadList = findThreadListNavigation();
    if (!threadList) return null;

    const candidates = Array.from(threadList.querySelectorAll('div')).filter((element) => {
      if (element.closest('#uninstagram-dialog')) return false;
      const style = getComputedStyle(element);
      if (!['auto', 'scroll', 'overlay'].includes(style.overflowY)) return false;
      if (element.scrollHeight <= element.clientHeight + 4 || element.clientHeight < 80) return false;

      const rect = element.getBoundingClientRect();
      return rect.width >= 48 && rect.height >= 80 && rect.bottom > 0 && rect.top < window.innerHeight;
    });

    return candidates.sort((left, right) => (
      (right.scrollHeight - right.clientHeight) - (left.scrollHeight - left.clientHeight)
    ))[0] ?? null;
  }

  async function loadAllInboxChats() {
    if (state.loadingChats || state.allChatsLoaded || state.running) return;
    const generation = state.chatLoadGeneration + 1;
    state.chatLoadGeneration = generation;
    state.loadingChats = true;
    if (rememberThreadOrderFromDom()) renderThreadOptions();
    setIdleReadyStatus();
    setControls();

    let scroller = null;
    for (let attempt = 0; attempt < 5 && !scroller; attempt += 1) {
      scroller = findInboxThreadScroller();
      if (!scroller) await sleep(CONFIG.inboxLoadPollMs);
    }

    if (!scroller || generation !== state.chatLoadGeneration) {
      if (generation === state.chatLoadGeneration) {
        state.loadingChats = false;
        state.allChatsLoaded = Boolean(
          state.availableThreads.size > 0 &&
          findThreadListNavigation()
        );
        setIdleReadyStatus();
        setControls();
      }
      return;
    }

    const originalScrollTop = scroller.scrollTop;
    let reachedEnd = false;
    try {
      scroller.scrollTop = 0;
      await sleep(CONFIG.inboxLoadPollMs);
      if (rememberThreadOrderFromDom(true)) renderThreadOptions();

      for (let step = 0; step < CONFIG.inboxLoadMaxSteps; step += 1) {
        if (generation !== state.chatLoadGeneration || state.running || !scroller.isConnected) break;

        const beforeHeight = scroller.scrollHeight;
        const beforeCount = state.availableThreads.size;
        scroller.scrollTop = beforeHeight;

        let grew = false;
        const polls = Math.ceil(CONFIG.inboxLoadWaitMs / CONFIG.inboxLoadPollMs);
        for (let poll = 0; poll < polls; poll += 1) {
          await sleep(CONFIG.inboxLoadPollMs);
          if (generation !== state.chatLoadGeneration || state.running || !scroller.isConnected) break;
          if (rememberThreadOrderFromDom()) renderThreadOptions();
          if (scroller.scrollHeight > beforeHeight || state.availableThreads.size > beforeCount) {
            grew = true;
            break;
          }
        }

        if (generation !== state.chatLoadGeneration || state.running || !scroller.isConnected) break;
        const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4;
        if (!grew && atBottom) {
          reachedEnd = true;
          break;
        }
      }
    } finally {
      if (scroller.isConnected) scroller.scrollTop = originalScrollTop;
      if (generation === state.chatLoadGeneration) {
        state.loadingChats = false;
        state.allChatsLoaded = reachedEnd;
        setIdleReadyStatus();
        setControls();
      }
    }
  }

  function cancelChatLoading() {
    if (!state.loadingChats) return;
    state.chatLoadGeneration += 1;
    state.loadingChats = false;
    setControls();
  }

  function ownSenderFbid(thread) {
    return thread?.viewer?.interop_messaging_user_fbid ?? null;
  }

  function isDeletableOwnMessage(message, senderFbid) {
    return Boolean(
      message?.message_id &&
      message.sender_fbid === senderFbid &&
      message.tombstone_reason == null &&
      message.content?.__typename !== 'SlideMessageAdminText',
    );
  }

  function pageMessages(thread) {
    return thread?.slide_messages?.edges?.map((edge) => edge?.node).filter(Boolean) ?? [];
  }

  function readDateFilter() {
    const mode = state.dialog?.querySelector('[data-role="date-mode"]')?.value ?? '';
    const dateValue = state.dialog?.querySelector('[data-role="date"]')?.value ?? '';
    if (!['all', 'before', 'after'].includes(mode)) {
      throw new Error('Choose which messages to delete before starting.');
    }
    if (mode === 'all') {
      return { mode, dateValue: '', label: 'regardless of date' };
    }
    if (!dateValue) throw new Error('Choose a date before starting.');

    const [year, month, day] = dateValue.split('-').map(Number);
    const start = new Date(year, month - 1, day).getTime();
    const end = new Date(year, month - 1, day + 1).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new Error('The selected date is invalid.');
    }
    const formatted = new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(start);

    if (mode === 'before') {
      return {
        mode,
        dateValue,
        start,
        end,
        label: `before ${formatted}`,
      };
    }
    return {
      mode,
      dateValue,
      start,
      end,
      label: `after ${formatted}`,
    };
  }

  function matchesDateFilter(message, dateFilter) {
    if (dateFilter.mode === 'all') return true;
    const timestamp = Number(message?.timestamp_ms);
    if (!Number.isFinite(timestamp)) {
      throw new Error(`Message ${message?.message_id ?? '(unknown)'} has no valid timestamp. Deletion stopped safely.`);
    }
    if (dateFilter.mode === 'before') return timestamp < dateFilter.start;
    if (dateFilter.mode === 'after') return timestamp >= dateFilter.end;
    throw new Error('The date filter became invalid. Deletion stopped safely.');
  }

  function setStatus(message) {
    const node = state.dialog?.querySelector('[data-role="status"]');
    if (node) node.textContent = message;
  }

  function setProgress(message) {
    const node = state.dialog?.querySelector('[data-role="progress"]');
    if (node) node.textContent = message;
  }

  function setTargetLabel() {
    const node = state.dialog?.querySelector('[data-role="target"]');
    if (!node) return;
    let message;
    if (state.running && state.activeChatLabel) {
      const position = state.targetCount > 1
        ? ` (${state.activeTargetIndex + 1} of ${state.targetCount})`
        : '';
      message = `Deleting messages in ${state.activeChatLabel}${position}`;
    } else {
      const targets = selectedTargets();
      if (targets.length === 0) message = 'Selected chats: none';
      else if (targets.length === 1) message = `Selected chat: ${targets[0].label}`;
      else message = `Selected chats: ${targets.length}`;
    }
    if (node.textContent !== message) node.textContent = message;
  }

  function setIdleReadyStatus() {
    if (state.running) return;
    if (state.loadingChats) {
      setStatus(`Loading all chats… ${state.availableThreads.size} found.`);
      return;
    }
    const targets = selectedTargets();
    if (targets.length > 0 && state.requestTemplate) {
      const targetLabel = targets.length === 1 ? targets[0].label : `${targets.length} selected chats`;
      setStatus(`Ready to delete your messages in ${targetLabel}. Set your filters and start the deletion process.`);
    } else if (state.availableThreads.size > 0) {
      setStatus('Select one or more chats before starting.');
    } else {
      setStatus('Waiting for Instagram to load your chats…');
    }
  }

  function setControls() {
    if (!state.dialog) return;
    const dateMode = state.dialog.querySelector('[data-role="date-mode"]');
    const dateInput = state.dialog.querySelector('[data-role="date"]');
    const threadPicker = state.dialog.querySelector('[data-action="toggle-thread-picker"]');
    const rangePicker = state.dialog.querySelector('[data-action="toggle-range-picker"]');
    const startButton = state.dialog.querySelector('[data-action="start"]');
    startButton.disabled = state.loadingChats || (state.running && state.stopped);
    startButton.dataset.tone = state.confirmArmed || (state.running && state.cancelHover)
      ? 'danger'
      : 'primary';
    if (state.running) {
      startButton.textContent = state.stopped ? 'Cancelling…' : (state.cancelHover ? 'Cancel?' : 'Deleting…');
      startButton.setAttribute('aria-label', state.stopped ? 'Cancelling deletion' : 'Cancel deletion');
      startButton.title = state.stopped ? 'Cancelling deletion' : 'Cancel deletion';
    } else {
      startButton.textContent = state.confirmArmed ? 'Are you sure?' : 'Start deletion';
      startButton.removeAttribute('aria-label');
      startButton.removeAttribute('title');
    }
    state.dialog.querySelector('[data-action="pause"]').disabled = !state.running || state.stopped;
    state.dialog.querySelector('[data-action="pause"]').textContent = state.paused ? 'Resume' : 'Pause';
    dateMode.disabled = state.running;
    dateInput.disabled = state.running || !['before', 'after'].includes(dateMode.value);
    threadPicker.disabled = state.running || state.availableThreads.size === 0;
    rangePicker.disabled = state.running;
    state.dialog.querySelectorAll('[data-role="thread-options"] input').forEach((input) => {
      input.disabled = state.running;
    });
    state.dialog.querySelectorAll('[data-role="range-options"] input').forEach((input) => {
      input.disabled = state.running;
    });
  }

  function resetStartConfirmation() {
    state.confirmArmed = false;
    state.confirmationSelectionKey = null;
    setControls();
  }

  function handleFilterChange() {
    if (state.running) return;
    resetStartConfirmation();
  }

  function makeRequestParams(friendlyName, docId, variables, requestTemplate = state.requestTemplate) {
    if (!requestTemplate) throw new Error('Instagram request data has not been captured yet. Reload Instagram.');
    const params = new URLSearchParams(requestTemplate);
    params.set('fb_api_caller_class', 'RelayModern');
    params.set('fb_api_req_friendly_name', friendlyName);
    params.set('server_timestamps', 'true');
    params.set('doc_id', docId);
    params.set('variables', JSON.stringify(variables));

    const originalNumber = Number.parseInt(params.get('__req') || '0', 36) || 0;
    state.requestNumber += 1;
    params.set('__req', (originalNumber + state.requestNumber).toString(36));
    return params;
  }

  async function graphql(friendlyName, docId, variables, requestTemplate) {
    const params = makeRequestParams(friendlyName, docId, variables, requestTemplate);
    const response = await originalFetch('/api/graphql', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-FB-Friendly-Name': friendlyName,
        'X-IG-App-ID': '936619743392459',
      },
      body: params.toString(),
    });

    const text = await response.text();
    if (!response.ok) throw new Error(`${friendlyName} failed with HTTP ${response.status}.`);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${friendlyName} returned an unexpected response. Reload Instagram and try again.`);
    }
  }

  async function fetchThread(routeId, requestTemplate) {
    const json = await graphql('IGDThreadDetailQuery', CONFIG.queryDocId, {
      min_uq_seq_id: null,
      thread_fbid: routeId,
      __relay_internal__pv__IGDEnableOffMsysChatThemesQErelayprovider: false,
      __relay_internal__pv__IGDInitialMessagePageCountrelayprovider: CONFIG.pageSize,
      __relay_internal__pv__PolarisAIGMAccountLabelEnabledrelayprovider: false,
    }, requestTemplate);

    const thread = getThreadFromDetail(json);
    if (!thread) throw new Error('Instagram did not return this chat. Reload and try again.');
    if (!threadMatchesRoute(thread, routeId)) {
      throw new Error('Instagram returned a chat other than the selected chat. No messages were deleted from this chat.');
    }
    captureAvailableThread(thread, routeId);
    if (currentRouteId() === String(routeId)) {
      state.thread = thread;
      state.threadRouteId = String(routeId);
    }
    return thread;
  }

  async function fetchOlderThread(threadFbid, cursor, requestTemplate) {
    const json = await graphql('IGDMessageListOffMsysQuery', CONFIG.paginationDocId, {
      after: cursor,
      before: null,
      first: CONFIG.pageSize,
      last: null,
      newer_than_message_id: null,
      older_than_message_id: null,
      id: threadFbid,
      __relay_internal__pv__IGDInitialMessagePageCountrelayprovider: CONFIG.pageSize,
    }, requestTemplate);
    const thread = getThreadFromPagination(json);
    if (!thread) throw new Error('Instagram did not return the next message batch.');
    return thread;
  }

  async function unsendMessage(message, threadId, requestTemplate) {
    const json = await graphql('IGDMessageUnsendDialogOffMsysMutation', CONFIG.unsendDocId, {
      message_id: message.message_id,
      send_data: { thread_id: threadId },
    }, requestTemplate);
    if (json?.data?.direct_unsend_message !== true) {
      const detail = json?.errors?.[0]?.message ?? 'Instagram did not confirm the unsend.';
      throw new Error(detail);
    }
  }

  function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  async function waitWhilePaused() {
    while (state.paused && !state.stopped) await sleep(200);
  }

  function randomDelayMs() {
    const spread = CONFIG.maxDelayMs - CONFIG.minDelayMs + 1;
    return CONFIG.minDelayMs + Math.floor(Math.random() * spread);
  }

  async function waitWithControls(milliseconds) {
    let remaining = milliseconds;
    while (remaining > 0 && !state.stopped) {
      await waitWhilePaused();
      if (state.stopped) break;
      const interval = Math.min(200, remaining);
      await sleep(interval);
      remaining -= interval;
    }
  }

  async function waitBeforeNextAction(nextLabel = 'Next action') {
    if (
      state.processed > 0 &&
      state.processed % CONFIG.cooldownEvery === 0 &&
      state.lastCooldownProcessed !== state.processed
    ) {
      state.lastCooldownProcessed = state.processed;
      setStatus(`Pausing for ${CONFIG.cooldownMs / 1000} seconds after ${CONFIG.cooldownEvery} messages…`);
      await waitWithControls(CONFIG.cooldownMs);
      return;
    }

    const delay = randomDelayMs();
    setStatus(`${nextLabel} in ${(delay / 1000).toFixed(1)} seconds…`);
    await waitWithControls(delay);
  }

  async function deleteMessagesInThread(target, dateFilter, requestTemplate) {
    setStatus(`Loading batch 1 for ${target.label} (${dateFilter.label})…`);
    const firstThread = await fetchThread(target.routeId, requestTemplate);
    const activeThreadId = firstThread.thread_id;
    if (!activeThreadId) throw new Error('Instagram did not provide a usable ID for this chat.');
    state.activeChatLabel = chatLabel(firstThread);
    setTargetLabel();
    const senderFbid = ownSenderFbid(firstThread);
    if (!senderFbid) throw new Error('Could not identify your Instagram account in this chat.');

    const seenMessageIds = new Set();
    let threadPage = firstThread;
    let batchNumber = 0;
    let hasNextPage = false;

    while (threadPage && batchNumber < CONFIG.maxPages && !state.stopped) {
      await waitWhilePaused();
      if (state.stopped) break;

      batchNumber += 1;
      const pageInfo = threadPage.slide_messages?.page_info;
      hasNextPage = Boolean(pageInfo?.has_next_page && pageInfo.end_cursor);
      const batch = pageMessages(threadPage)
        .filter((message) => {
          if (seenMessageIds.has(message.message_id)) return false;
          seenMessageIds.add(message.message_id);
          return isDeletableOwnMessage(message, senderFbid) && matchesDateFilter(message, dateFilter);
        })
        .sort((a, b) => Number(b.timestamp_ms) - Number(a.timestamp_ms));

      if (batch.length === 0) {
        if (hasNextPage) {
          const delay = randomDelayMs();
          setStatus(`${target.label}, batch ${batchNumber}: no matching messages. Loading the next batch in ${(delay / 1000).toFixed(1)} seconds…`);
          await waitWithControls(delay);
          if (state.stopped) break;
        } else {
          setStatus(`${target.label}, batch ${batchNumber}: no matching messages.`);
        }
      }

      for (let index = 0; index < batch.length; index += 1) {
        await waitWhilePaused();
        if (state.stopped) break;

        const message = batch[index];
        if (!matchesDateFilter(message, dateFilter)) {
          throw new Error('A message no longer matches the selected date filter. Deletion stopped safely.');
        }
        setStatus(`${target.label}, batch ${batchNumber}: deleting message ${index + 1} of ${batch.length}…`);
        try {
          await unsendMessage(message, activeThreadId, requestTemplate);
          state.deleted += 1;
        } catch (error) {
          state.failed += 1;
          console.warn('[Deinstagram] Could not unsend', message.message_id, error);
        }

        state.processed += 1;
        setProgress(`${state.deleted} deleted, ${state.failed} failed`);
        const moreWorkExpected = index < batch.length - 1 || hasNextPage;
        if (moreWorkExpected && !state.stopped) await waitBeforeNextAction();
      }

      if (state.stopped || !hasNextPage) break;
      setStatus(`Loading batch ${batchNumber + 1} for ${target.label}…`);
      await waitWhilePaused();
      if (state.stopped) break;
      threadPage = await fetchOlderThread(firstThread.thread_fbid, pageInfo.end_cursor, requestTemplate);
    }

    if (!state.stopped && batchNumber >= CONFIG.maxPages && hasNextPage) {
      throw new Error(`Stopped after ${CONFIG.maxPages} batches for safety.`);
    }
  }

  async function startDeleting() {
    if (state.running) return;
    if (state.loadingChats) {
      setStatus('Wait for Instagram to finish loading your chats before starting.');
      return;
    }
    if (!state.requestTemplate) {
      resetStartConfirmation();
      setStatus('Instagram request data has not been captured yet. Reload Instagram and try again.');
      return;
    }

    let dateFilter;
    try {
      dateFilter = readDateFilter();
    } catch (error) {
      resetStartConfirmation();
      setStatus(error.message);
      return;
    }

    const runTargets = selectedTargets().map(({ routeId, label }) => ({ routeId, label }));
    if (runTargets.length === 0) {
      resetStartConfirmation();
      setStatus('Select one or more chats before starting.');
      return;
    }

    const selectionKey = selectedTargetsKey();
    if (!state.confirmArmed || state.confirmationSelectionKey !== selectionKey) {
      state.confirmArmed = true;
      state.confirmationSelectionKey = selectionKey;
      setControls();
      return;
    }

    resetStartConfirmation();
    const runRequestTemplate = new URLSearchParams(state.requestTemplate);

    state.chatLoadGeneration += 1;
    state.loadingChats = false;
    state.running = true;
    state.paused = false;
    state.stopped = false;
    state.cancelHover = false;
    state.deleted = 0;
    state.failed = 0;
    state.chatFailures = 0;
    state.processed = 0;
    state.lastCooldownProcessed = 0;
    state.targetCount = runTargets.length;
    setThreadPickerExpanded(false);
    setRangePickerExpanded(false);
    setTargetLabel();
    setProgress('0 deleted, 0 failed');
    setControls();

    try {
      for (let targetIndex = 0; targetIndex < runTargets.length && !state.stopped; targetIndex += 1) {
        await waitWhilePaused();
        if (state.stopped) break;
        const target = runTargets[targetIndex];
        state.activeTargetIndex = targetIndex;
        state.activeRouteId = target.routeId;
        state.activeChatLabel = target.label;
        setTargetLabel();

        try {
          await deleteMessagesInThread(target, dateFilter, runRequestTemplate);
        } catch (error) {
          state.chatFailures += 1;
          console.warn('[Deinstagram] Could not process chat', target.routeId, error);
          setStatus(`Skipped ${target.label}: ${error.message}`);
        }

        if (targetIndex < runTargets.length - 1 && !state.stopped) {
          await waitBeforeNextAction('Next chat');
        }
      }

      const skippedChats = state.chatFailures === 0
        ? ''
        : ` ${state.chatFailures} ${state.chatFailures === 1 ? 'chat was' : 'chats were'} skipped.`;
      setStatus(state.stopped ? 'Stopped.' : `Deletion finished.${skippedChats}`);
      setProgress(`${state.deleted} deleted, ${state.failed} failed`);
    } catch (error) {
      setStatus(error.message);
      setProgress(`${state.deleted} deleted, ${state.failed} failed before stopping.`);
    } finally {
      state.running = false;
      state.paused = false;
      state.cancelHover = false;
      state.activeRouteId = null;
      state.activeChatLabel = null;
      state.activeTargetIndex = 0;
      state.targetCount = 0;
      setTargetLabel();
      setControls();
    }
  }

  function togglePause() {
    if (!state.running) return;
    state.paused = !state.paused;
    setStatus(state.paused ? 'Paused.' : 'Resuming…');
    setControls();
  }

  function cancelDeleting() {
    if (!state.running) return;
    state.stopped = true;
    state.paused = false;
    state.cancelHover = false;
    setStatus('Cancelling after the current request…');
    setControls();
  }

  function handleStartAction() {
    if (state.running) cancelDeleting();
    else startDeleting();
  }

  function installDialogStyles() {
    if (document.getElementById('uninstagram-styles')) return;
    const style = document.createElement('style');
    style.id = 'uninstagram-styles';
    style.textContent = INSTAGRAM_UI_STYLES;
    (document.head ?? document.documentElement).appendChild(style);
  }

  function syncDialogColorScheme() {
    if (!state.dialog) return;
    const channels = getComputedStyle(document.documentElement)
      .getPropertyValue('--ig-primary-background')
      .split(',')
      .map((value) => Number(value.trim()));
    const luminance = channels.length === 3 && channels.every(Number.isFinite)
      ? (channels[0] * 0.2126) + (channels[1] * 0.7152) + (channels[2] * 0.0722)
      : 255;
    const scheme = luminance < 128 ? 'dark' : 'light';
    if (state.dialog.style.colorScheme !== scheme) state.dialog.style.colorScheme = scheme;
  }

  function createDialog() {
    if (document.getElementById('uninstagram-dialog')) return;
    installDialogStyles();
    const dialog = document.createElement('dialog');
    dialog.id = 'uninstagram-dialog';
    dialog.setAttribute('aria-labelledby', 'uninstagram-title');
    dialog.innerHTML = `
      <header class="uninstagram-header">
        <h2 id="uninstagram-title" class="uninstagram-title">Deinstagram</h2>
      </header>
      <div class="uninstagram-body">
        <section class="uninstagram-context" aria-label="Deletion status">
          <p class="uninstagram-target" data-role="target" aria-live="polite">Selected chats: none</p>
          <p class="uninstagram-status" data-role="status" aria-live="polite">Waiting for Instagram to load your chats…</p>
        </section>
        <p class="uninstagram-progress" data-role="progress" aria-live="polite">0 deleted, 0 failed</p>
        <fieldset class="uninstagram-fields">
          <legend>Filters</legend>
          <div class="uninstagram-field-grid">
            <div class="uninstagram-field">
              <span id="uninstagram-chats-label">Chats</span>
              <div class="uninstagram-thread-picker">
                <button class="uninstagram-thread-picker-button" type="button" data-action="toggle-thread-picker" aria-labelledby="uninstagram-chats-label uninstagram-thread-picker-summary" aria-controls="uninstagram-thread-options" aria-expanded="false">
                  <span id="uninstagram-thread-picker-summary" class="uninstagram-thread-picker-summary" data-role="thread-picker-summary">Select chats</span>
                  <svg class="uninstagram-select-chevron" aria-hidden="true" viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></polyline>
                  </svg>
                </button>
                <div id="uninstagram-thread-options" class="uninstagram-thread-options" data-role="thread-options" hidden></div>
              </div>
            </div>
            <div class="uninstagram-field">
              <span id="uninstagram-range-label">Message range</span>
              <div class="uninstagram-range-picker">
                <button class="uninstagram-thread-picker-button" type="button" data-action="toggle-range-picker" aria-labelledby="uninstagram-range-label uninstagram-range-picker-summary" aria-controls="uninstagram-range-options" aria-expanded="false">
                  <span id="uninstagram-range-picker-summary" class="uninstagram-thread-picker-summary" data-role="range-picker-summary">All messages</span>
                  <svg class="uninstagram-select-chevron" aria-hidden="true" viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></polyline>
                  </svg>
                </button>
                <select class="uninstagram-native-state" data-role="date-mode" aria-hidden="true" tabindex="-1">
                  <option value="all" selected>All messages</option>
                  <option value="before">Before a selected date</option>
                  <option value="after">After a selected date</option>
                </select>
                <div id="uninstagram-range-options" class="uninstagram-range-options" data-role="range-options" hidden>
                  <label class="uninstagram-thread-option">
                    <input type="radio" name="uninstagram-range" value="all" checked>
                    <span>All messages</span>
                  </label>
                  <label class="uninstagram-thread-option">
                    <input type="radio" name="uninstagram-range" value="before">
                    <span>Before a selected date</span>
                  </label>
                  <label class="uninstagram-thread-option">
                    <input type="radio" name="uninstagram-range" value="after">
                    <span>After a selected date</span>
                  </label>
                </div>
              </div>
            </div>
            <label class="uninstagram-field">
              <span>Date</span>
              <input data-role="date" type="date" disabled>
            </label>
          </div>
        </fieldset>
      </div>
      <footer class="uninstagram-actions">
        <button class="uninstagram-action" type="button" data-action="start" data-tone="primary">Start deletion</button>
        <button class="uninstagram-action" type="button" data-action="pause" data-tone="secondary" disabled>Pause</button>
      </footer>
    `;
    document.body.appendChild(dialog);
    state.dialog = dialog;
    syncDialogColorScheme();
    const startButton = dialog.querySelector('[data-action="start"]');
    startButton.addEventListener('click', handleStartAction);
    startButton.addEventListener('mouseenter', () => {
      if (!state.running || state.stopped) return;
      state.cancelHover = true;
      setControls();
    });
    startButton.addEventListener('mouseleave', () => {
      if (!state.running || state.stopped) return;
      state.cancelHover = false;
      setControls();
    });
    dialog.querySelector('[data-action="pause"]').addEventListener('click', togglePause);
    dialog.querySelector('[data-action="toggle-thread-picker"]').addEventListener('click', () => {
      const options = dialog.querySelector('[data-role="thread-options"]');
      setThreadPickerExpanded(options.hidden);
    });
    dialog.querySelector('[data-action="toggle-range-picker"]').addEventListener('click', () => {
      const options = dialog.querySelector('[data-role="range-options"]');
      setRangePickerExpanded(options.hidden);
    });
    dialog.querySelectorAll('[data-role="range-options"] input').forEach((input) => {
      input.addEventListener('change', handleRangeSelectionChange);
    });
    dialog.querySelector('[data-role="date-mode"]').addEventListener('change', () => {
      updateRangeSelectionControls();
      handleFilterChange();
    });
    dialog.querySelector('[data-role="date"]').addEventListener('change', handleFilterChange);
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog();
      }
    });
    document.addEventListener('keydown', handleThreadTypeahead);
    document.addEventListener('click', (event) => {
      if (!state.dialog?.open) return;
      const clickedInsideDialog = state.dialog.contains(event.target);
      const threadPicker = state.dialog.querySelector('.uninstagram-thread-picker');
      const rangePicker = state.dialog.querySelector('.uninstagram-range-picker');

      if (!threadPicker?.contains(event.target)) setThreadPickerExpanded(false);
      if (!rangePicker?.contains(event.target)) setRangePickerExpanded(false);
      if (clickedInsideDialog) return;
      if (document.getElementById('uninstagram-toggle')?.contains(event.target)) return;
      const dialogRouteId = state.dialogRouteId;
      cancelChatLoading();
      state.dialog.close();
      setToggleExpanded(false);
      setTimeout(() => {
        if (currentRouteKey() !== dialogRouteId) {
          state.reopenDialogOnReturn = true;
        } else {
          resetStartConfirmation();
          state.reopenDialogOnReturn = false;
        }
      }, 0);
    });
    renderThreadOptions();
    updateRangeSelectionControls();
    setTargetLabel();
    setIdleReadyStatus();
    setControls();
  }

  function setToggleExpanded(expanded) {
    document.getElementById('uninstagram-toggle')?.setAttribute('aria-expanded', String(expanded));
  }

  function positionDialog() {
    if (!state.dialog?.open) return;
    const toggle = document.getElementById('uninstagram-toggle');
    if (!toggle) return;

    const toggleRect = toggle.getBoundingClientRect();
    const width = Math.min(CONFIG.dialogWidth, Math.max(0, window.innerWidth - 16));
    const left = Math.max(8, Math.min(toggleRect.right - width, window.innerWidth - width - 8));
    const top = toggleRect.bottom + 8;
    state.dialog.style.inset = 'auto';
    state.dialog.style.left = `${left}px`;
    state.dialog.style.top = `${top}px`;
    state.dialog.style.right = 'auto';
    state.dialog.style.bottom = 'auto';
    state.dialog.style.maxHeight = `${Math.max(120, window.innerHeight - top - 8)}px`;
    positionThreadOptions();
    positionRangeOptions();
  }

  function openDialog() {
    createDialog();
    const routeKey = currentRouteKey();
    if (!routeKey) return;
    const routeChanged = state.dialogRouteId !== routeKey;
    if (state.dialogRouteId && routeChanged) resetStartConfirmation();
    state.dialogRouteId = routeKey;
    state.reopenDialogOnReturn = false;
    setTargetLabel();
    if (routeChanged) setIdleReadyStatus();
    if (!state.dialog.open) state.dialog.show();
    positionDialog();
    setToggleExpanded(true);
    void loadAllInboxChats();
  }

  function closeDialog() {
    cancelChatLoading();
    resetStartConfirmation();
    state.reopenDialogOnReturn = false;
    setThreadPickerExpanded(false);
    setRangePickerExpanded(false);
    if (state.dialog?.open) state.dialog.close();
    setToggleExpanded(false);
  }

  function syncDialogWithRoute(routeKey) {
    if (!state.dialogRouteId) return;
    if (routeKey !== state.dialogRouteId && state.dialog?.open) {
      cancelChatLoading();
      setThreadPickerExpanded(false);
      setRangePickerExpanded(false);
      state.dialog.close();
      state.reopenDialogOnReturn = true;
      setToggleExpanded(false);
      return;
    }
    if (routeKey === state.dialogRouteId && state.reopenDialogOnReturn && !state.dialog?.open) {
      state.reopenDialogOnReturn = false;
      state.dialog.show();
      setToggleExpanded(true);
    }
  }

  function toggleDialog() {
    if (state.dialog?.open) closeDialog();
    else openDialog();
  }

  function installHeaderToggle() {
    let toggle = document.getElementById('uninstagram-toggle');
    const routeId = currentRouteId();
    const routeKey = currentRouteKey();
    if (!routeKey) {
      toggle?.remove();
      syncDialogWithRoute(null);
      return;
    }

    const anchor = routeId
      ? document.querySelector('svg[aria-label="Conversation information"]')?.closest('[role="button"]')
      : document.querySelector('svg[aria-label="New message"]')?.closest('[role="button"]');
    if (!anchor?.parentElement) return;

    document.querySelectorAll('.uninstagram-toggle-host').forEach((host) => {
      if (!routeId || host !== anchor.parentElement) host.classList.remove('uninstagram-toggle-host');
    });
    if (!routeId) anchor.parentElement.classList.add('uninstagram-toggle-host');

    if (!toggle) {
      toggle = anchor.cloneNode(false);
      toggle.id = 'uninstagram-toggle';
      toggle.setAttribute('aria-label', 'Delete my messages');
      toggle.setAttribute('aria-expanded', String(Boolean(state.dialog?.open)));
      toggle.title = 'Delete my messages';
      toggle.innerHTML = NATIVE_TRASH_ICON;
      toggle.addEventListener('click', toggleDialog);
      toggle.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleDialog();
        }
      });
    }

    if (toggle.previousElementSibling !== anchor) anchor.after(toggle);
    syncDialogWithRoute(routeKey);
    if (!state.running) setTargetLabel();
    syncDialogColorScheme();
    positionDialog();
  }

  function initializeUi() {
    createDialog();
    installHeaderToggle();
    new MutationObserver(() => {
      installHeaderToggle();
      if (rememberThreadOrderFromDom()) renderThreadOptions();
      positionDialog();
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', positionDialog);
    window.addEventListener('scroll', positionDialog, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUi, { once: true });
  } else {
    initializeUi();
  }
})();

const SPREADSHEET_ID = "19NBQmVYYCg3ej3DDBrX0f3Zb1Ueougr-m-8xQHoK6Jk";

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

function ensureRolesSheet(ss) {
  let sheet = ss.getSheetByName("Roles");
  if (!sheet) {
    sheet = ss.insertSheet("Roles");
    sheet.appendRow(["id", "role_name", "can_create_case"]);
    sheet.appendRow([1, "Owner/Admin", true]);
    sheet.appendRow([2, "Operation", true]);
    sheet.appendRow([3, "Sales", true]);
    sheet.appendRow([4, "Local Agent", false]);
  }
  return sheet;
}

function ensureTemplatesSheets(ss) {
  let tSheet = ss.getSheetByName("CaseTemplates");
  if (!tSheet) {
    tSheet = ss.insertSheet("CaseTemplates");
    tSheet.appendRow(["id", "template_name", "description", "group_names"]);
  }
  let taskSheet = ss.getSheetByName("TemplateTasks");
  if (!taskSheet) {
    taskSheet = ss.insertSheet("TemplateTasks");
    taskSheet.appendRow(["id", "template_id", "group_name", "title", "start_day_offset", "due_day_offset", "notes"]);
  }
  return { templatesSheet: tSheet, templateTasksSheet: taskSheet };
}

/**
 * Initialize Google Sheets database with mock tables and data.
 */
function initDatabase() {
  const ss = getSpreadsheet();
  
  // Helper function to safely recreate sheets
  function setupSheet(name, headers) {
    let sheet = ss.getSheetByName(name);
    if (sheet) {
      sheet.clear();
    } else {
      sheet = ss.insertSheet(name);
    }
    sheet.appendRow(headers);
    return sheet;
  }
  
  // 1. Roles Sheet
  const roleHeaders = ["id", "role_name", "can_create_case"];
  const roleSheet = setupSheet("Roles", roleHeaders);
  roleSheet.appendRow([1, "Owner/Admin", true]);
  roleSheet.appendRow([2, "Operation", true]);
  roleSheet.appendRow([3, "Sales", true]);
  roleSheet.appendRow([4, "Local Agent", false]);

  // 2. Users Sheet
  const userHeaders = ["id", "username", "role_id", "avatar_color", "language", "google_email", "is_super_master"];
  const userSheet = setupSheet("Users", userHeaders);
  userSheet.appendRow([1, "Martin", 1, "#4f46e5", "zh-TW", "martin@example.com", true]);
  userSheet.appendRow([2, "OP_Ning", 2, "#0ea5e9", "zh-TW", "", false]);
  userSheet.appendRow([3, "Sales_Yang", 3, "#f59e0b", "zh-TW", "", false]);
  userSheet.appendRow([4, "Local_Nguyen", 4, "#10b981", "vi-VN", "", false]);

  // 3. Cases Sheet
  const caseHeaders = ["id", "title", "description", "owner_id", "drive_url", "group_names"];
  const caseSheet = setupSheet("Cases", caseHeaders);
  caseSheet.appendRow([1, "2026/09/15 馬航怡保專案", "本次怡保出團之完整追蹤與住宿協調工作", 1, "https://drive.google.com/drive/folders/mock-id", "票務與交通, LOCAL 與 住宿, 名單與證件"]);

  // 4. Tasks Sheet
  const taskHeaders = ["id", "case_id", "group_name", "title", "due_date", "start_date", "is_completed", "notes", "visible_user_ids"];
  const taskSheet = setupSheet("Tasks", taskHeaders);
  taskSheet.appendRow([1, 1, "票務與交通", "【票務組】收取訂金與開票確認", "2026-08-30", "2026-08-01", false, "記得確認開票代號與退改簽規則", "1,2,3"]);
  taskSheet.appendRow([2, 1, "LOCAL 與 住宿", "訂怡保當地飯店", "2026-08-25", "2026-08-10", true, "訂單號已收到，請與 Local 再次核對", "1,2,4"]);
  taskSheet.appendRow([3, 1, "LOCAL 與 住宿", "確認遊覽車車號", "2026-09-10", "2026-08-20", false, "車型要求3年內新車，含司機電話", "1,2"]);
  taskSheet.appendRow([4, 1, "名單與證件", "收集護照影本與辦理簽證", "2026-08-15", "2026-08-01", false, "逾期警報！請業務儘速追回護照正本", "1,3,4"]);

  // 5. Comments Sheet
  const commentHeaders = ["id", "task_id", "user_id", "content", "created_at"];
  const commentSheet = setupSheet("Comments", commentHeaders);
  commentSheet.appendRow([1, 2, 2, "飯店確認信已收到，確認號：#12345", "2026-08-15 14:00:00"]);
  commentSheet.appendRow([2, 2, 4, "Đã xác nhận phòng với khách sạn rồi nhé!", "2026-08-15 15:30:00"]);

  // 6. CaseTemplates Sheet
  const templateHeaders = ["id", "template_name", "description", "group_names"];
  const templateSheet = setupSheet("CaseTemplates", templateHeaders);
  templateSheet.appendRow([1, "馬航怡保 5 天團範本", "馬來西亞怡保 5 天團之標準作業流程模板", "票務與交通, LOCAL 與 住宿, 名單與證件"]);
  templateSheet.appendRow([2, "日本賞櫻 5 天團範本", "日本賞櫻團之標準作業流程模板", "機票組, 飯店與行程, 簽證與保險"]);

  // 7. TemplateTasks Sheet
  const templateTaskHeaders = ["id", "template_id", "group_name", "title", "start_day_offset", "due_day_offset", "notes"];
  const templateTaskSheet = setupSheet("TemplateTasks", templateTaskHeaders);
  // Malaysia Ipoh template tasks
  templateTaskSheet.appendRow([1, 1, "票務與交通", "【票務組】收取訂金與開票確認", -45, -30, "記得確認開票代號與退改簽規則"]);
  templateTaskSheet.appendRow([2, 1, "LOCAL 與 住宿", "【LOCAL組】預定怡保當地飯店", -30, -15, "訂單號收到後請與 Local 再次核對"]);
  templateTaskSheet.appendRow([3, 1, "LOCAL 與 住宿", "【LOCAL組】確認遊覽車與導遊資訊", -15, -5, "車型要求3年內新車，含司機電話"]);
  templateTaskSheet.appendRow([4, 1, "名單與證件", "【證件組】收集護照與辦理簽證", -40, -20, "逾期警報！請業務儘速追回護照正本"]);
  // Japan Cherry Blossom template tasks
  templateTaskSheet.appendRow([5, 2, "機票組", "機票開立與機位確認", -60, -45, "確認名單拼音與機位"]);
  templateTaskSheet.appendRow([6, 2, "飯店與行程", "預訂東京/京都飯店", -50, -35, "注意賞櫻季房位緊張"]);
  templateTaskSheet.appendRow([7, 2, "簽證與保險", "投保旅行平安險", -20, -7, "需有名單身分證號"]);
}

/**
 * Handle HTTP GET Requests.
 */
function resolveParams(e) {
  let params = {};
  if (e && e.postData && e.postData.contents) {
    try {
      params = JSON.parse(e.postData.contents);
    } catch (err) {
      // ignore parse error
    }
  }
  if (e && e.parameter) {
    for (let k in e.parameter) {
      params[k] = e.parameter[k];
    }
  }
  return params;
}

function handleRequest(action, params) {
  function getInt(val) {
    if (val === undefined || val === null || val === "") return null;
    const parsed = parseInt(val);
    return isNaN(parsed) ? null : parsed;
  }

  if (action === "getUsers") {
    return getUsers();
  } else if (action === "getRoles") {
    return getRoles();
  } else if (action === "getCases") {
    const userId = getInt(params.user_id);
    if (userId === null) {
      throw new Error("Missing or invalid user_id parameter");
    }
    return getCasesForUser(userId);
  } else if (action === "getTemplates") {
    return getTemplates();
  } else if (action === "toggleTask") {
    return toggleTask(getInt(params.taskId));
  } else if (action === "createCase") {
    let groups = params.groups;
    if (typeof groups === "string") {
      try {
        groups = JSON.parse(groups);
      } catch (err) {
        groups = groups.split(",").map(s => s.trim()).filter(s => s.length > 0);
      }
    }
    return createCase(
      params.title,
      params.description,
      getInt(params.owner_id),
      groups,
      getInt(params.template_id),
      params.reference_date
    );
  } else if (action === "createTemplate") {
    return createTemplate(params.template_name, params.description, params.group_names);
  } else if (action === "updateTemplate") {
    return updateTemplate(getInt(params.templateId), params.template_name, params.description, params.group_names);
  } else if (action === "deleteTemplate") {
    return deleteTemplate(getInt(params.templateId));
  } else if (action === "createTemplateTask") {
    return createTemplateTask(
      getInt(params.templateId),
      params.group_name,
      params.title,
      getInt(params.start_day_offset),
      getInt(params.due_day_offset),
      params.notes
    );
  } else if (action === "updateTemplateTask") {
    return updateTemplateTask(
      getInt(params.taskId),
      params.group_name,
      params.title,
      getInt(params.start_day_offset),
      getInt(params.due_day_offset),
      params.notes
    );
  } else if (action === "deleteTemplateTask") {
    return deleteTemplateTask(getInt(params.taskId));
  } else if (action === "createTask") {
    return createTask(
      getInt(params.case_id),
      params.group_name,
      params.title,
      params.due_date,
      params.start_date,
      params.visible_user_ids
    );
  } else if (action === "updateTask") {
    return updateTask(
      getInt(params.taskId),
      params.notes,
      params.visible_user_ids,
      params.due_date,
      params.start_date
    );
  } else if (action === "deleteTask") {
    return deleteTask(getInt(params.taskId));
  } else if (action === "updateCase") {
    let groups = params.groups;
    if (typeof groups === "string") {
      try {
        groups = JSON.parse(groups);
      } catch (err) {
        groups = groups.split(",").map(s => s.trim()).filter(s => s.length > 0);
      }
    }
    return updateCase(
      getInt(params.caseId),
      params.title,
      params.description,
      params.driveUrl,
      groups
    );
  } else if (action === "deleteCase") {
    return deleteCase(getInt(params.caseId));
  } else if (action === "addComment") {
    return addComment(
      getInt(params.taskId),
      getInt(params.user_id),
      params.content
    );
  } else if (action === "createRole") {
    return createRole(params.role_name, params.can_create_case);
  } else if (action === "updateRole") {
    return updateRole(getInt(params.roleId), params.role_name, params.can_create_case);
  } else if (action === "deleteRole") {
    return deleteRole(getInt(params.roleId));
  } else if (action === "createUser") {
    return createUser(params.username, getInt(params.roleId), params.avatar_color, params.language, params.google_email);
  } else if (action === "updateUser") {
    return updateUser(getInt(params.userId), params.username, params.roleId !== undefined ? getInt(params.roleId) : undefined, params.avatar_color, params.language, params.google_email);
  } else if (action === "deleteUser") {
    return deleteUser(getInt(params.userId));
  } else {
    throw new Error("Unknown action: " + action);
  }
}

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  
  // If no action is specified, serve index.html directly as the Web App UI
  if (!action) {
    return HtmlService.createHtmlOutputFromFile("index")
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
      .setTitle("CaseFlow OS - 案件協同與權限管家")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  let responseData;
  try {
    const params = resolveParams(e);
    responseData = handleRequest(action, params);
  } catch (error) {
    responseData = { status: "error", message: error.toString() };
  }

  const jsonString = JSON.stringify(responseData);
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP POST Requests.
 */
function doPost(e) {
  let responseData;
  try {
    const params = resolveParams(e);
    const action = params.action;
    if (!action) {
      throw new Error("Missing action parameter");
    }
    responseData = handleRequest(action, params);
  } catch (error) {
    responseData = { status: "error", message: error.toString() };
  }

  const jsonString = JSON.stringify(responseData);
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Fetch all users.
 */
function getUsers() {
  const ss = getSpreadsheet();
  
  // First load all roles into a map
  const rolesSheet = ensureRolesSheet(ss);
  const rolesMap = {};
  if (rolesSheet) {
    const roleValues = rolesSheet.getDataRange().getValues();
    for (let i = 1; i < roleValues.length; i++) {
      const rId = parseInt(roleValues[i][0]);
      rolesMap[rId] = {
        id: rId,
        role_name: roleValues[i][1],
        can_create_case: roleValues[i][2] === true || roleValues[i][2] === "TRUE"
      };
    }
  }

  const sheet = ss.getSheetByName("Users");
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < values.length; i++) {
    const uId = parseInt(values[i][0]);
    const uName = values[i][1];
    const roleVal = values[i][2];
    let roleId = parseInt(roleVal);
    let roleName = "Unknown";
    let canCreateCase = false;

    if (isNaN(roleId)) {
      // Legacy fallback: roleVal is a string (e.g. "Owner/Admin")
      roleName = String(roleVal || "Unknown");
      canCreateCase = (roleName === "Owner/Admin" || roleName === "Operation" || roleName === "Sales");
      roleId = (roleName === "Owner/Admin") ? 1 : (roleName === "Operation" ? 2 : (roleName === "Sales" ? 3 : 4));
    } else {
      const roleObj = rolesMap[roleId] || { id: roleId, role_name: "Unknown", can_create_case: false };
      roleName = roleObj.role_name;
      canCreateCase = roleObj.can_create_case;
    }

    const isSuper = (values[i][6] === true || values[i][6] === "TRUE" || uId === 1 || uName === "Martin");

    users.push({
      id: uId,
      username: uName,
      role_id: roleId,
      role_name: roleName,
      can_create_case: canCreateCase || isSuper,
      avatar_color: values[i][3],
      language: values[i][4],
      google_email: values[i][5] || "",
      is_super_master: isSuper
    });
  }
  return users;
}

/**
 * Fetch and construct filtered Case tree for a specific user.
 */
function getCasesForUser(userId) {
  const ss = getSpreadsheet();
  const users = getUsers();
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  // Load all comments
  const commentsSheet = ss.getSheetByName("Comments");
  const commentValues = commentsSheet ? commentsSheet.getDataRange().getValues() : [];
  const commentsByTaskId = {};
  for (let i = 1; i < commentValues.length; i++) {
    const cId = parseInt(commentValues[i][0]);
    const tId = parseInt(commentValues[i][1]);
    const uId = parseInt(commentValues[i][2]);
    const content = commentValues[i][3];
    const createdAt = commentValues[i][4];
    
    if (!commentsByTaskId[tId]) {
      commentsByTaskId[tId] = [];
    }
    commentsByTaskId[tId].push({
      id: cId,
      task_id: tId,
      user_id: uId,
      content: content,
      created_at: formatDateString(createdAt, true)
    });
  }

  // Load all tasks
  const tasksSheet = ss.getSheetByName("Tasks");
  const taskValues = tasksSheet ? tasksSheet.getDataRange().getValues() : [];
  const tasksByCaseId = {};
  for (let i = 1; i < taskValues.length; i++) {
    const tId = parseInt(taskValues[i][0]);
    const caseId = parseInt(taskValues[i][1]);
    const groupName = taskValues[i][2];
    const title = taskValues[i][3];
    const dueDate = taskValues[i][4];
    const startDate = taskValues[i][5];
    const isCompleted = taskValues[i][6] === true || taskValues[i][6] === "TRUE";
    const notes = taskValues[i][7];
    const visibleUserIdsStr = taskValues[i][8].toString();
    
    const visibleUserIds = visibleUserIdsStr ? visibleUserIdsStr.split(",").map(idStr => parseInt(idStr.trim())).filter(id => !isNaN(id)) : [];
    
    // Authorization filter: user must be in visible list
    if (!visibleUserIds.includes(userId)) {
      continue;
    }

    const taskObj = {
      id: tId,
      case_id: caseId,
      group_name: groupName,
      title: title,
      due_date: formatDateString(dueDate, false),
      start_date: formatDateString(startDate, false),
      is_completed: isCompleted,
      notes: notes,
      visible_user_ids: visibleUserIds,
      visible_users: visibleUserIds.map(uId => userMap[uId]).filter(u => u !== undefined),
      comments: commentsByTaskId[tId] || []
    };

    if (!tasksByCaseId[caseId]) {
      tasksByCaseId[caseId] = [];
    }
    tasksByCaseId[caseId].push(taskObj);
  }

  // Load all cases
  const casesSheet = ss.getSheetByName("Cases");
  const caseValues = casesSheet ? casesSheet.getDataRange().getValues() : [];
  const cases = [];
  for (let i = 1; i < caseValues.length; i++) {
    const cId = parseInt(caseValues[i][0]);
    const title = caseValues[i][1];
    const description = caseValues[i][2];
    const ownerId = parseInt(caseValues[i][3]);
    const driveUrl = caseValues[i][4];
    const groupNamesStr = caseValues[i][5] || "";
    
    const groupNames = groupNamesStr ? groupNamesStr.split(",").map(g => g.trim()).filter(g => g.length > 0) : [];
    const caseTasks = tasksByCaseId[cId] || [];
    
    // Only return the case if user is the owner OR has at least one visible task in it
    if (ownerId !== userId && caseTasks.length === 0) {
      continue;
    }

    // Dynamic grouping by group_name
    const groupMap = {};
    groupNames.forEach(gn => {
      groupMap[gn] = [];
    });
    
    caseTasks.forEach(t => {
      if (!groupMap[t.group_name]) {
        groupMap[t.group_name] = [];
      }
      groupMap[t.group_name].push(t);
    });

    const groups = Object.keys(groupMap).map((gn, index) => {
      return {
        id: index + 1,
        name: gn,
        tasks: groupMap[gn]
      };
    });

    cases.push({
      id: cId,
      title: title,
      description: description,
      owner_id: ownerId,
      owner: userMap[ownerId] || { username: "System", role: "" },
      drive_url: driveUrl,
      groups: groups
    });
  }

  return cases;
}

/**
 * Auto-increment ID helper.
 */
function getNextId(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return 1;
  let maxId = 0;
  for (let i = 1; i < values.length; i++) {
    const id = parseInt(values[i][0]);
    if (!isNaN(id) && id > maxId) {
      maxId = id;
    }
  }
  return maxId + 1;
}

/**
 * Date formatter for Apps Script.
 */
function formatDateString(dateVal, includeTime) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    const pattern = includeTime ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd";
    return Utilities.formatDate(dateVal, "GMT+8", pattern);
  }
  const str = dateVal.toString();
  if (str.includes("T")) {
    return includeTime ? str.replace("T", " ").split(".")[0] : str.split("T")[0];
  }
  return str;
}

/**
 * Actions
 */

function toggleTask(taskId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Tasks");
  if (!sheet) throw new Error("Tasks sheet not initialized");
  
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === taskId) {
      const currentVal = values[i][6] === true || values[i][6] === "TRUE";
      const newVal = !currentVal;
      sheet.getRange(i + 1, 7).setValue(newVal);
      return { status: "success", taskId: taskId, is_completed: newVal };
    }
  }
  throw new Error("Task with ID " + taskId + " not found");
}

function createCase(title, description, ownerId, groups, templateId, referenceDate) {
  const ss = getSpreadsheet();
  
  // Permission check
  const users = getUsers();
  const user = users.find(u => u.id === ownerId);
  if (!user) {
    throw new Error("找不到使用者！");
  }
  const isSuper = user.is_super_master === true || user.id === 1 || user.username === "Martin";
  const hasPerm = user.can_create_case === true || user.role_name === "Owner/Admin" || user.role_name === "Operation" || user.role_name === "Sales";
  if (!isSuper && !hasPerm) {
    throw new Error("您無權限建立案件！");
  }

  const sheet = ss.getSheetByName("Cases");
  if (!sheet) throw new Error("Cases sheet not initialized");
  
  const nextId = getNextId(sheet);
  const groupsStr = Array.isArray(groups) ? groups.join(", ") : groups;
  const driveUrl = "https://drive.google.com/drive/folders/mock-id";
  sheet.appendRow([nextId, title, description || "", ownerId, driveUrl, groupsStr]);

  // If template is selected and reference date is provided, auto-create tasks
  if (templateId && referenceDate) {
    ensureTemplatesSheets(ss);
    const taskSheet = ss.getSheetByName("TemplateTasks");
    const taskValues = taskSheet ? taskSheet.getDataRange().getValues() : [];
    
    // Parse referenceDate (e.g. "2026-09-15") safely to avoid timezone issue
    const parts = referenceDate.split("-");
    const refDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const allUserIdsStr = users.map(u => u.id).join(",");

    for (let i = 1; i < taskValues.length; i++) {
      const tempId = parseInt(taskValues[i][1]);
      if (tempId === templateId) {
        const groupName = taskValues[i][2];
        const taskTitle = taskValues[i][3];
        const startOffset = parseInt(taskValues[i][4]);
        const dueOffset = parseInt(taskValues[i][5]);
        const notes = taskValues[i][6];

        const start = new Date(refDate);
        start.setDate(refDate.getDate() + (isNaN(startOffset) ? 0 : startOffset));
        const startDateStr = Utilities.formatDate(start, "GMT+8", "yyyy-MM-dd");

        const due = new Date(refDate);
        due.setDate(refDate.getDate() + (isNaN(dueOffset) ? 0 : dueOffset));
        const dueDateStr = Utilities.formatDate(due, "GMT+8", "yyyy-MM-dd");

        // Add task using helper function createTask
        createTask(nextId, groupName, taskTitle, dueDateStr, startDateStr, allUserIdsStr);
      }
    }
  }

  return { status: "success", caseId: nextId };
}

function createTask(caseId, groupName, title, dueDate, startDate, visibleUserIds) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Tasks");
  if (!sheet) throw new Error("Tasks sheet not initialized");
  
  const nextId = getNextId(sheet);
  const visIdsStr = Array.isArray(visibleUserIds) ? visibleUserIds.join(",") : visibleUserIds;
  
  sheet.appendRow([nextId, caseId, groupName, title, dueDate || "", startDate || "", false, "", visIdsStr]);
  return { status: "success", taskId: nextId };
}

function updateTask(taskId, notes, visibleUserIds, dueDate, startDate) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Tasks");
  if (!sheet) throw new Error("Tasks sheet not initialized");
  
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === taskId) {
      if (notes !== undefined) {
        sheet.getRange(i + 1, 8).setValue(notes);
      }
      if (visibleUserIds !== undefined) {
        const visIdsStr = Array.isArray(visibleUserIds) ? visibleUserIds.join(",") : visibleUserIds;
        sheet.getRange(i + 1, 9).setValue(visIdsStr);
      }
      if (dueDate !== undefined) {
        sheet.getRange(i + 1, 5).setValue(dueDate || "");
      }
      if (startDate !== undefined) {
        sheet.getRange(i + 1, 6).setValue(startDate || "");
      }
      return { status: "success", taskId: taskId };
    }
  }
  throw new Error("Task with ID " + taskId + " not found");
}

function addComment(taskId, userId, content) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Comments");
  if (!sheet) throw new Error("Comments sheet not initialized");
  
  const nextId = getNextId(sheet);
  const nowStr = Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss");
  sheet.appendRow([nextId, taskId, userId, content, nowStr]);
  return { status: "success", commentId: nextId };
}

function deleteTask(taskId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Tasks");
  if (!sheet) throw new Error("Tasks sheet not initialized");
  
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === taskId) {
      sheet.deleteRow(i + 1);
      deleteTaskComments(taskId);
      return { status: "success", taskId: taskId };
    }
  }
  throw new Error("Task with ID " + taskId + " not found");
}

function deleteTaskComments(taskId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Comments");
  if (!sheet) return;
  
  const values = sheet.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (parseInt(values[i][1]) === taskId) {
      sheet.deleteRow(i + 1);
    }
  }
}

function updateCase(caseId, title, description, driveUrl, groups) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Cases");
  if (!sheet) throw new Error("Cases sheet not initialized");
  
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === caseId) {
      if (title !== undefined) sheet.getRange(i + 1, 2).setValue(title);
      if (description !== undefined) sheet.getRange(i + 1, 3).setValue(description);
      if (driveUrl !== undefined) sheet.getRange(i + 1, 5).setValue(driveUrl);
      if (groups !== undefined) {
        const groupsStr = Array.isArray(groups) ? groups.join(", ") : groups;
        sheet.getRange(i + 1, 6).setValue(groupsStr);
      }
      return { status: "success", caseId: caseId };
    }
  }
  throw new Error("Case with ID " + caseId + " not found");
}

function deleteCase(caseId) {
  const ss = getSpreadsheet();
  
  // 1. Delete Case Row
  const caseSheet = ss.getSheetByName("Cases");
  if (!caseSheet) throw new Error("Cases sheet not initialized");
  
  let caseFound = false;
  const caseValues = caseSheet.getDataRange().getValues();
  for (let i = 1; i < caseValues.length; i++) {
    if (parseInt(caseValues[i][0]) === caseId) {
      caseSheet.deleteRow(i + 1);
      caseFound = true;
      break;
    }
  }
  if (!caseFound) throw new Error("Case with ID " + caseId + " not found");
  
  // 2. Find and delete all Tasks and associated Comments
  const taskSheet = ss.getSheetByName("Tasks");
  if (taskSheet) {
    const taskValues = taskSheet.getDataRange().getValues();
    for (let j = taskValues.length - 1; j >= 1; j--) {
      if (parseInt(taskValues[j][1]) === caseId) {
        const taskId = parseInt(taskValues[j][0]);
        taskSheet.deleteRow(j + 1);
        deleteTaskComments(taskId);
      }
    }
  }
  
  return { status: "success", caseId: caseId };
}

function getRoles() {
  const ss = getSpreadsheet();
  const sheet = ensureRolesSheet(ss);
  const values = sheet.getDataRange().getValues();
  const roles = [];
  for (let i = 1; i < values.length; i++) {
    roles.push({
      id: parseInt(values[i][0]),
      role_name: values[i][1],
      can_create_case: values[i][2] === true || values[i][2] === "TRUE"
    });
  }
  return roles;
}

function createRole(roleName, canCreateCase) {
  const ss = getSpreadsheet();
  const sheet = ensureRolesSheet(ss);
  const nextId = getNextId(sheet);
  sheet.appendRow([nextId, roleName, canCreateCase === true || canCreateCase === "true"]);
  return { status: "success", roleId: nextId };
}

function updateRole(roleId, roleName, canCreateCase) {
  const ss = getSpreadsheet();
  const sheet = ensureRolesSheet(ss);
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === roleId) {
      if (roleName !== undefined) sheet.getRange(i + 1, 2).setValue(roleName);
      if (canCreateCase !== undefined) sheet.getRange(i + 1, 3).setValue(canCreateCase === true || canCreateCase === "true");
      return { status: "success", roleId: roleId };
    }
  }
  throw new Error("Role with ID " + roleId + " not found");
}

function deleteRole(roleId) {
  const ss = getSpreadsheet();
  const sheet = ensureRolesSheet(ss);
  
  // Check if any user is using this role
  const usersSheet = ss.getSheetByName("Users");
  if (usersSheet) {
    const userValues = usersSheet.getDataRange().getValues();
    for (let i = 1; i < userValues.length; i++) {
      if (parseInt(userValues[i][2]) === roleId) {
        throw new Error("無法刪除此職位，因為仍有成員指派在此職位下。");
      }
    }
  }

  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === roleId) {
      sheet.deleteRow(i + 1);
      return { status: "success", roleId: roleId };
    }
  }
  throw new Error("Role with ID " + roleId + " not found");
}

function createUser(username, roleId, avatarColor, language, googleEmail) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  if (!sheet) throw new Error("Users sheet not initialized");
  const nextId = getNextId(sheet);
  sheet.appendRow([nextId, username, roleId, avatarColor || "#4f46e5", language || "zh-TW", googleEmail || "", false]);
  return { status: "success", userId: nextId };
}

function updateUser(userId, username, roleId, avatarColor, language, googleEmail) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  if (!sheet) throw new Error("Users sheet not initialized");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === userId) {
      // Super Master protections: Martin (id = 1) must remain super master
      const isSuper = values[i][6] === true || values[i][6] === "TRUE";
      
      if (username !== undefined) sheet.getRange(i + 1, 2).setValue(username);
      if (roleId !== undefined) {
        // If they are super master, keep role_id as Owner/Admin (1)
        if (isSuper) {
          sheet.getRange(i + 1, 3).setValue(1);
        } else {
          sheet.getRange(i + 1, 3).setValue(roleId);
        }
      }
      if (avatarColor !== undefined) sheet.getRange(i + 1, 4).setValue(avatarColor);
      if (language !== undefined) sheet.getRange(i + 1, 5).setValue(language);
      if (googleEmail !== undefined) sheet.getRange(i + 1, 6).setValue(googleEmail);
      
      return { status: "success", userId: userId };
    }
  }
  throw new Error("User with ID " + userId + " not found");
}

function deleteUser(userId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Users");
  if (!sheet) throw new Error("Users sheet not initialized");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === userId) {
      const isSuper = values[i][6] === true || values[i][6] === "TRUE";
      if (isSuper || userId === 1) {
        throw new Error("無法刪除超級管理員 Super Master (Martin)！");
      }
      sheet.deleteRow(i + 1);
      return { status: "success", userId: userId };
    }
  }
  throw new Error("User with ID " + userId + " not found");
}

function getTemplates() {
  const ss = getSpreadsheet();
  ensureTemplatesSheets(ss);
  
  const tSheet = ss.getSheetByName("CaseTemplates");
  const taskSheet = ss.getSheetByName("TemplateTasks");
  
  const tValues = tSheet.getDataRange().getValues();
  const taskValues = taskSheet ? taskSheet.getDataRange().getValues() : [];
  
  const tasksByTemplateId = {};
  for (let i = 1; i < taskValues.length; i++) {
    const taskId = parseInt(taskValues[i][0]);
    const templateId = parseInt(taskValues[i][1]);
    const groupName = taskValues[i][2];
    const title = taskValues[i][3];
    const startOffset = parseInt(taskValues[i][4]);
    const dueOffset = parseInt(taskValues[i][5]);
    const notes = taskValues[i][6];
    
    if (!tasksByTemplateId[templateId]) {
      tasksByTemplateId[templateId] = [];
    }
    tasksByTemplateId[templateId].push({
      id: taskId,
      template_id: templateId,
      group_name: groupName,
      title: title,
      start_day_offset: isNaN(startOffset) ? 0 : startOffset,
      due_day_offset: isNaN(dueOffset) ? 0 : dueOffset,
      notes: notes || ""
    });
  }
  
  const templates = [];
  for (let i = 1; i < tValues.length; i++) {
    const tId = parseInt(tValues[i][0]);
    const name = tValues[i][1];
    const desc = tValues[i][2];
    const groupsStr = tValues[i][3] || "";
    const groupNames = groupsStr ? groupsStr.split(",").map(g => g.trim()).filter(g => g.length > 0) : [];
    
    templates.push({
      id: tId,
      template_name: name,
      description: desc || "",
      group_names: groupNames,
      tasks: tasksByTemplateId[tId] || []
    });
  }
  return templates;
}

function createTemplate(name, description, groups) {
  const ss = getSpreadsheet();
  ensureTemplatesSheets(ss);
  const sheet = ss.getSheetByName("CaseTemplates");
  const nextId = getNextId(sheet);
  const groupsStr = Array.isArray(groups) ? groups.join(", ") : groups;
  sheet.appendRow([nextId, name, description || "", groupsStr]);
  return { status: "success", templateId: nextId };
}

function updateTemplate(templateId, name, description, groups) {
  const ss = getSpreadsheet();
  ensureTemplatesSheets(ss);
  const sheet = ss.getSheetByName("CaseTemplates");
  const values = sheet.getDataRange().getValues();
  const groupsStr = Array.isArray(groups) ? groups.join(", ") : groups;
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === templateId) {
      sheet.getRange(i + 1, 2).setValue(name);
      sheet.getRange(i + 1, 3).setValue(description || "");
      sheet.getRange(i + 1, 4).setValue(groupsStr);
      return { status: "success", templateId: templateId };
    }
  }
  throw new Error("Template with ID " + templateId + " not found");
}

function deleteTemplate(templateId) {
  const ss = getSpreadsheet();
  ensureTemplatesSheets(ss);
  
  // Delete template details
  const sheet = ss.getSheetByName("CaseTemplates");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === templateId) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  
  // Cascade delete all tasks associated with this template
  const taskSheet = ss.getSheetByName("TemplateTasks");
  let taskValues = taskSheet ? taskSheet.getDataRange().getValues() : [];
  for (let i = taskValues.length - 1; i >= 1; i--) {
    if (parseInt(taskValues[i][1]) === templateId) {
      taskSheet.deleteRow(i + 1);
    }
  }
  
  return { status: "success", templateId: templateId };
}

function createTemplateTask(templateId, groupName, title, startDayOffset, dueDayOffset, notes) {
  const ss = getSpreadsheet();
  ensureTemplatesSheets(ss);
  const sheet = ss.getSheetByName("TemplateTasks");
  const nextId = getNextId(sheet);
  sheet.appendRow([nextId, templateId, groupName, title, startDayOffset || 0, dueDayOffset || 0, notes || ""]);
  return { status: "success", taskId: nextId };
}

function updateTemplateTask(taskId, groupName, title, startDayOffset, dueDayOffset, notes) {
  const ss = getSpreadsheet();
  ensureTemplatesSheets(ss);
  const sheet = ss.getSheetByName("TemplateTasks");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === taskId) {
      sheet.getRange(i + 1, 3).setValue(groupName);
      sheet.getRange(i + 1, 4).setValue(title);
      sheet.getRange(i + 1, 5).setValue(startDayOffset || 0);
      sheet.getRange(i + 1, 6).setValue(dueDayOffset || 0);
      sheet.getRange(i + 1, 7).setValue(notes || "");
      return { status: "success", taskId: taskId };
    }
  }
  throw new Error("Template task with ID " + taskId + " not found");
}

function deleteTemplateTask(taskId) {
  const ss = getSpreadsheet();
  ensureTemplatesSheets(ss);
  const sheet = ss.getSheetByName("TemplateTasks");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (parseInt(values[i][0]) === taskId) {
      sheet.deleteRow(i + 1);
      return { status: "success", taskId: taskId };
    }
  }
  throw new Error("Template task with ID " + taskId + " not found");
}

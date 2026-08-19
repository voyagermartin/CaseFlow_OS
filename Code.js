const SPREADSHEET_ID = "19NBQmVYYCg3ej3DDBrX0f3Zb1Ueougr-m-8xQHoK6Jk";

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
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
  
  // 1. Users Sheet
  const userHeaders = ["id", "username", "role", "avatar_color", "language"];
  const userSheet = setupSheet("Users", userHeaders);
  userSheet.appendRow([1, "Martin", "Owner/Admin", "#4f46e5", "zh-TW"]);
  userSheet.appendRow([2, "OP_Ning", "Operation", "#0ea5e9", "zh-TW"]);
  userSheet.appendRow([3, "Sales_Yang", "Sales", "#f59e0b", "zh-TW"]);
  userSheet.appendRow([4, "Local_Nguyen", "Local Agent", "#10b981", "vi-VN"]);

  // 2. Cases Sheet
  const caseHeaders = ["id", "title", "description", "owner_id", "drive_url", "group_names"];
  const caseSheet = setupSheet("Cases", caseHeaders);
  caseSheet.appendRow([1, "2026/09/15 馬航怡保專案", "本次怡保出團之完整追蹤與住宿協調工作", 1, "https://drive.google.com/drive/folders/mock-id", "票務與交通, LOCAL 與 住宿, 名單與證件"]);

  // 3. Tasks Sheet
  const taskHeaders = ["id", "case_id", "group_name", "title", "due_date", "start_date", "is_completed", "notes", "visible_user_ids"];
  const taskSheet = setupSheet("Tasks", taskHeaders);
  taskSheet.appendRow([1, 1, "票務與交通", "【票務組】收取訂金與開票確認", "2026-08-30", "2026-08-01", false, "記得確認開票代號與退改簽規則", "1,2,3"]);
  taskSheet.appendRow([2, 1, "LOCAL 與 住宿", "訂怡保當地飯店", "2026-08-25", "2026-08-10", true, "訂單號已收到，請與 Local 再次核對", "1,2,4"]);
  taskSheet.appendRow([3, 1, "LOCAL 與 住宿", "確認遊覽車車號", "2026-09-10", "2026-08-20", false, "車型要求3年內新車，含司機電話", "1,2"]);
  taskSheet.appendRow([4, 1, "名單與證件", "收集護照影本與辦理簽證", "2026-08-15", "2026-08-01", false, "逾期警報！請業務儘速追回護照正本", "1,3,4"]);

  // 4. Comments Sheet
  const commentHeaders = ["id", "task_id", "user_id", "content", "created_at"];
  const commentSheet = setupSheet("Comments", commentHeaders);
  commentSheet.appendRow([1, 2, 2, "飯店確認信已收到，確認號：#12345", "2026-08-15 14:00:00"]);
  commentSheet.appendRow([2, 2, 4, "Đã xác nhận phòng với khách sạn rồi nhé!", "2026-08-15 15:30:00"]);
}

/**
 * Handle HTTP GET Requests.
 */
function doGet(e) {
  const action = e.parameter.action;
  let responseData;

  try {
    if (action === "getUsers") {
      responseData = getUsers();
    } else if (action === "getCases") {
      const userId = parseInt(e.parameter.user_id);
      if (isNaN(userId)) {
        throw new Error("Missing or invalid user_id parameter");
      }
      responseData = getCasesForUser(userId);
    } else {
      responseData = { status: "success", message: "CaseFlow OS GAS API works!" };
    }
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
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    if (action === "toggleTask") {
      responseData = toggleTask(parseInt(postData.taskId));
    } else if (action === "createCase") {
      responseData = createCase(postData.title, postData.description, parseInt(postData.owner_id), postData.groups);
    } else if (action === "createTask") {
      responseData = createTask(
        parseInt(postData.case_id),
        postData.group_name,
        postData.title,
        postData.due_date,
        postData.start_date,
        postData.visible_user_ids
      );
    } else if (action === "updateTask") {
      responseData = updateTask(
        parseInt(postData.taskId),
        postData.notes,
        postData.visible_user_ids,
        postData.due_date,
        postData.start_date
      );
    } else if (action === "addComment") {
      responseData = addComment(
        parseInt(postData.taskId),
        parseInt(postData.user_id),
        postData.content
      );
    } else {
      throw new Error("Unknown action: " + action);
    }
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
  const sheet = ss.getSheetByName("Users");
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < values.length; i++) {
    users.push({
      id: parseInt(values[i][0]),
      username: values[i][1],
      role: values[i][2],
      avatar_color: values[i][3],
      language: values[i][4]
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

function createCase(title, description, ownerId, groups) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName("Cases");
  if (!sheet) throw new Error("Cases sheet not initialized");
  
  const nextId = getNextId(sheet);
  const groupsStr = Array.isArray(groups) ? groups.join(", ") : groups;
  const driveUrl = "https://drive.google.com/drive/folders/mock-id";
  sheet.appendRow([nextId, title, description || "", ownerId, driveUrl, groupsStr]);
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

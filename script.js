document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const adviceTextEl = document.getElementById("adviceText");
  const newAdviceBtn = document.getElementById("newAdvice");

  // Article Elements
  const articleGrid = document.getElementById("articleGrid");

  // Media Elements
  const mediaGrid = document.getElementById("mediaGrid");
  const filterBtns = document.querySelectorAll(".filter-btn");

  // Goal Elements
  const goalInput = document.getElementById("goalInput");
  const goalDescriptionInput = document.getElementById("goalDescriptionInput");
  const addGoalBtn = document.getElementById("addGoal");
  const goalListEl = document.getElementById("goalList");
  const progressPercentageEl =
    document.getElementById("progressPercentage");
  const progressBarEl = document.getElementById("progressBar");

  // --- State Management ---
  const GOALS_STORAGE_KEY = "motivation_platform_goals";
  let goals = [];

  // A small class to manage inline editing of objectives
  class ObjectiveEditor {
    constructor(getGoalsRef, saveFn, renderFn) {
      // getGoalsRef should be a function returning the current goals array reference
      this.getGoals = getGoalsRef;
      this.save = saveFn;
      this.render = renderFn;
    }

    enableEditing(spanEl, goalId, isDescription = false) {
      if (!spanEl) return;
      spanEl.setAttribute("contenteditable", "true");
      spanEl.classList.add("editable");
      // Move caret to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(spanEl);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      const onKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          spanEl.blur();
        } else if (e.key === "Escape") {
          // revert
          const g = this.getGoals().find((g) => g.id === goalId);
          if (isDescription) {
            spanEl.textContent = g ? g.description : "";
          } else {
            spanEl.textContent = g ? g.text : "";
          }
          spanEl.blur();
        }
      };

      const onBlur = () => {
        spanEl.removeAttribute("contenteditable");
        spanEl.classList.remove("editable");
        spanEl.removeEventListener("keydown", onKey);
        spanEl.removeEventListener("blur", onBlur);

        const newText = spanEl.textContent.trim();
        const goal = this.getGoals().find((g) => g.id === goalId);
        
        if (goal) {
          if (isDescription) {
            // For descriptions, empty is allowed
            goal.description = newText;
          } else {
            // For titles, empty is not allowed
            if (!newText) {
              spanEl.textContent = goal.text;
              return;
            }
            goal.text = newText;
          }
          this.save();
          this.render();
        }
      };

      spanEl.addEventListener("keydown", onKey);
      spanEl.addEventListener("blur", onBlur);
    }
  }

  let objectiveEditor = null; // will instantiate after functions are defined

  // --- Mock Data ---
  const MOCK_ARTICLES_DATA = [
    {
      source: { name: "Quora" },
      title:
        "What are some effective ways to get motivated? Can motivational quotes help with this?",
      url: "https://www.quora.com/What-are-some-effective-ways-to-get-motivated-Can-motivational-quotes-help-with-this",
      urlToImage:
        "https://fiverr-res.cloudinary.com/images/q_auto,f_auto/gigs/199179772/original/bee070c66cf7ad652a057b0adf0e8f12dc81c658/make-a-attractive-motivational-thumbnails.jpg",
    },
    {
      source: { name: "Educated Minds" },
      title: "top 50 david goggins quotes",
      url: "https://www.educatedminds1.com/50-david-goggins-quotes-to-help-fuel-your-unstoppable-mindset/",
      urlToImage:
        "https://i.pinimg.com/736x/8d/4e/4b/8d4e4b53014cd9ec47c9b78812431221.jpg",
    },
    {
      source: { name: "hbr" },
      title: "How to Keep Working When You're Just Not Feeling It",
      url: "https://hbr.org/2018/11/how-to-keep-working-when-youre-just-not-feeling-it",
      urlToImage:
        "https://hbr.org/resources/images/article_assets/2018/10/R1806L_SCHNEIDER.png",
    },
  ];

  const MOCK_MEDIA_DATA = [
    {
      id: 1,
      type: "video",
      tags: ["video", "gym", "celebrities"],
      title: "David Goggins: Taking Souls & Suffering",
      thumbnail:
        "https://i.pinimg.com/736x/8f/27/62/8f276251a9e74551ef1ad93bb9119363.jpg",
      url: "https://www.youtube.com/watch?v=I5X1vO_Jlrk",
    },
    {
      id: 2,
      type: "video",
      tags: ["video", "compilation", "morning"],
      title: "THE MENTALITY | Best Motivational Speech",
      thumbnail:
        "https://i.pinimg.com/736x/f3/4c/e3/f34ce361626f1987139254ba3e64a4aa.jpg",
      url: "https://www.youtube.com/watch?v=CD7Q3B1Y9-s",
    },
    {
      id: 3,
      type: "podcast",
      tags: ["podcast", "wisdom", "interviews"],
      title: "Huberman Lab: Mastering Willpower",
      thumbnail: "https://i.ytimg.com/vi/hFL6qRIJZ_Y/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=hFL6qRIJZ_Y",
    },
    {
      id: 4,
      type: "podcast",
      tags: ["podcast", "gym", "wisdom"],
      title: "Jocko Podcast: Discipline Equals Freedom",
      thumbnail:
        "https://mpd-biblio-covers.imgix.net/9781250274434.jpg?w=900&dpr=1",
      url: "https://www.youtube.com/watch?v=J3Gg9_f5C2c",
    },
    {
      id: 5,
      type: "video",
      tags: ["video", "quotes", "wisdom"],
      title: "Sun Tzu's Quotes that are Worth Listening To",
      thumbnail:
        "https://i.pinimg.com/1200x/33/53/c6/3353c62d03a26a5c96ac9e0c830a1480.jpg",
      url: "https://youtu.be/jxcMRkqaQdw",
    },
    {
      id: 6,
      type: "video",
      tags: ["video", "business", "interviews", "celebrities"],
      title: "Steve Jobs on the Rules for Success",
      thumbnail: "https://i.ytimg.com/vi/eHzAtxW3TzY/hqdefault.jpg",
      url: "https://www.youtube.com/watch?v=eHzAtxW3TzY",
    },
  ];

  // --- Functions ---

  const fetchAdvice = async () => {
    adviceTextEl.textContent = "Loading...";
    try {
      const response = await fetch("https://api.adviceslip.com/advice");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      adviceTextEl.textContent = data.slip.advice;
    } catch (error) {
      console.error("Failed to fetch advice:", error);
      adviceTextEl.textContent =
        "Could not fetch advice. Please try again later.";
    }
  };

  const fetchArticles = async () => {
    articleGrid.innerHTML = `
      <div class="skeleton-article">
          <div class="skeleton skeleton-img"></div>
          <div class="skeleton-text-container">
              <div class="skeleton skeleton-line" style="width: 30%"></div>
              <div class="skeleton skeleton-line" style="width: 90%"></div>
              <div class="skeleton skeleton-line" style="width: 75%"></div>
          </div>
      </div>
    `.repeat(3);

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading

    try {
      // In a real app, this would be an API call like:
      // const response = await fetch("https://newsapi.org/v2/everything?q=motivation&apiKey=YOUR_KEY");
      // const data = await response.json();
      // const articles = data.articles;
      const articles = MOCK_ARTICLES_DATA;

      articleGrid.innerHTML = "";
      articles.forEach((article) => {
        const articleEl = document.createElement("a");
        articleEl.className = "article-item";
        articleEl.href = article.url;
        articleEl.target = "_blank";

        // Fallback for missing images
        const imageUrl =
          article.urlToImage ||
          "https://via.placeholder.com/80x80/6366f1/ffffff?text=:-) ";

        articleEl.innerHTML = `
          <img src="${imageUrl}" alt="${article.title}" class="article-img">
          <div class="article-content">
              <p class="article-source">${article.source.name}</p>
              <h3 class="article-title">${article.title}</h3>
          </div>
        `;
        articleGrid.appendChild(articleEl);
      });
    } catch (error) {
      console.error("Failed to fetch articles", error);
      articleGrid.innerHTML =
        '<p class="empty-state">Could not load articles.</p>';
    }
  };

  const fetchMedia = async (filter = "all") => {
    mediaGrid.innerHTML =
      '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>';

    await new Promise((resolve) => setTimeout(resolve, 800));

    const filteredData =
      filter === "all"
        ? MOCK_MEDIA_DATA
        : MOCK_MEDIA_DATA.filter((item) => item.tags.includes(filter));

    mediaGrid.innerHTML = "";
    if (filteredData.length > 0) {
      filteredData.forEach((item) => {
        const card = document.createElement("a");
        card.href = item.url;
        card.target = "_blank";
        card.className = "media-item";

        card.innerHTML = `
          <div class="thumbnail-wrapper">
              <img src="${item.thumbnail}" alt="${item.title}" class="thumbnail-img" loading="lazy">
              <div class="play-icon"></div>
          </div>
          <div class="media-content">
              <span class="media-tag">${item.type}</span>
              <h3 class="media-title">${item.title}</h3>
          </div>
        `;
        mediaGrid.appendChild(card);
      });
    } else {
      mediaGrid.innerHTML =
        '<p class="empty-state">No items found for this category.</p>';
    }
  };

  const loadGoals = () => {
    try {
      const stored = localStorage.getItem(GOALS_STORAGE_KEY);
      goals = JSON.parse(stored || "[]").map((goal) => {
        if (typeof goal.done !== "undefined") {
          return {
            id: goal.id,
            text: goal.text,
            description: goal.description || "",
            progress: goal.done ? 100 : 0,
          };
        }
        // Ensure description exists for all goals
        return {
          ...goal,
          description: goal.description || ""
        };
      });
    } catch (e) {
      goals = [];
    }
    renderGoals();
  };

  const saveGoals = () =>
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));

  const renderProgress = () => {
    if (goals.length === 0) {
      progressPercentageEl.textContent = "0%";
      progressBarEl.style.width = "0%";
      return;
    }
    const totalProgress = goals.reduce(
      (sum, goal) => sum + (goal.progress || 0),
      0
    );
    const percentage = Math.round(totalProgress / goals.length);

    progressPercentageEl.textContent = `${percentage}%`;
    progressBarEl.style.width = `${percentage}%`;
  };

  const renderGoals = () => {
    goalListEl.innerHTML = "";

    if (goals.length === 0) {
      goalListEl.innerHTML =
        '<li class="empty-state">No objectives yet. Add one below!</li>';
    } else {
      goals.forEach((goal) => {
        const li = document.createElement("li");
        li.className = (goal.progress || 0) === 100 ? "completed" : "";
        li.dataset.id = goal.id;

        // Goal header with title and controls
        const goalHeader = document.createElement("div");
        goalHeader.className = "goal-header";

        const goalInfo = document.createElement("div");
        goalInfo.className = "goal-info";

        const titleSpan = document.createElement("span");
        titleSpan.className = "goal-title";
        titleSpan.textContent = goal.text;
        titleSpan.title =
          "Double-click or use the edit button to change this objective";

        // Allow double-click to edit title
        titleSpan.addEventListener("dblclick", () => {
          if (objectiveEditor)
            objectiveEditor.enableEditing(titleSpan, goal.id, false);
        });

        // Edit button for title
        const editBtn = document.createElement("button");
        editBtn.className = "filter-btn";
        editBtn.style.padding = "6px 10px";
        editBtn.style.fontSize = "0.8em";
        editBtn.style.minWidth = "40px";
        editBtn.textContent = "✏️";
        editBtn.title = "Edit objective title";
        editBtn.addEventListener("click", () => {
          if (objectiveEditor)
            objectiveEditor.enableEditing(titleSpan, goal.id, false);
        });

        const infoWrapper = document.createElement("div");
        infoWrapper.style.display = "flex";
        infoWrapper.style.alignItems = "center";
        infoWrapper.style.gap = "10px";
        infoWrapper.appendChild(titleSpan);
        infoWrapper.appendChild(editBtn);

        goalInfo.appendChild(infoWrapper);

        const goalControls = document.createElement("div");
        goalControls.className = "goal-controls";

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = 0;
        slider.max = 100;
        slider.value = goal.progress || 0;
        slider.className = "progress-slider";
        const progressLabel = document.createElement("span");
        progressLabel.className = "progress-label";
        progressLabel.textContent = `${slider.value}%`;
        slider.addEventListener("input", () => {
          progressLabel.textContent = `${slider.value}%`;
        });
        slider.addEventListener("change", () => {
          updateGoalProgress(goal.id, slider.value);
        });
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = "&times;";
        deleteBtn.addEventListener("click", () => showDeleteConfirmation(goal.id, goal.text));

        goalControls.appendChild(slider);
        goalControls.appendChild(progressLabel);
        goalControls.appendChild(deleteBtn);

        goalHeader.appendChild(goalInfo);
        goalHeader.appendChild(goalControls);

        // Goal description section
        const descriptionSection = document.createElement("div");
        
        // Description header with label and edit button
        const descriptionHeader = document.createElement("div");
        descriptionHeader.className = "description-header";
        
        const descriptionLabel = document.createElement("span");
        descriptionLabel.className = "description-label-text";
        descriptionLabel.textContent = "Description";
        
        const descriptionEditBtn = document.createElement("button");
        descriptionEditBtn.className = "description-edit-btn";
        descriptionEditBtn.textContent = "✏️ Edit";
        descriptionEditBtn.title = "Edit description";
        descriptionEditBtn.addEventListener("click", () => {
          if (objectiveEditor)
            objectiveEditor.enableEditing(descriptionDiv, goal.id, true);
        });

        descriptionHeader.appendChild(descriptionLabel);
        descriptionHeader.appendChild(descriptionEditBtn);

        // Goal description content
        const descriptionDiv = document.createElement("div");
        descriptionDiv.className = `goal-description ${!goal.description ? 'empty' : ''}`;
        descriptionDiv.textContent = goal.description || "No description added. Click edit to add one.";
        descriptionDiv.title = "Double-click to add or edit description";
        
        // Allow double-click to edit description
        descriptionDiv.addEventListener("dblclick", () => {
          if (objectiveEditor)
            objectiveEditor.enableEditing(descriptionDiv, goal.id, true);
        });

        descriptionSection.appendChild(descriptionHeader);
        descriptionSection.appendChild(descriptionDiv);

        li.appendChild(goalHeader);
        li.appendChild(descriptionSection);
        goalListEl.appendChild(li);
      });
    }
    renderProgress();
  };

  // instantiate the ObjectiveEditor now that renderGoals is defined
  objectiveEditor = new ObjectiveEditor(
    () => goals,
    saveGoals,
    renderGoals
  );

  // --- Delete Confirmation Popup ---
  const showDeleteConfirmation = (goalId, goalText) => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "confirmation-overlay";
    
    // Create popup
    const popup = document.createElement("div");
    popup.className = "confirmation-popup";
    popup.innerHTML = `
      <h3>Delete Objective</h3>
      <p>Are you sure you want to delete "<strong>${goalText}</strong>"? This action cannot be undone.</p>
      <div class="confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="confirm-btn">Delete</button>
      </div>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Add event listeners
    const cancelBtn = popup.querySelector(".cancel-btn");
    const confirmBtn = popup.querySelector(".confirm-btn");
    
    const closePopup = () => {
      document.body.removeChild(overlay);
    };
    
    cancelBtn.addEventListener("click", closePopup);
    
    confirmBtn.addEventListener("click", () => {
      closePopup();
      deleteGoal(goalId);
    });
    
    // Close when clicking outside the popup
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closePopup();
      }
    });
    
    // Close with Escape key
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closePopup();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    
    document.addEventListener("keydown", handleEscape);
  };

  // --- Trash / Restore for deleted objectives ---
  const TRASH_STORAGE_KEY = "motivation_platform_trash";
  let deletedObjectives = []; // array to hold multiple deleted objectives
  const restoreContainer = document.getElementById("restoreContainer");
  const trashList = document.getElementById("trashList");
  const clearTrashBtn = document.getElementById("clearTrashBtn");
  let restoreTimer = null;
  const MAX_TRASH_ITEMS = 10; // limit trash to 10 items

  const saveTrash = () => {
    localStorage.setItem(
      TRASH_STORAGE_KEY,
      JSON.stringify(deletedObjectives)
    );
  };

  const renderTrashList = () => {
    trashList.innerHTML = "";
    if (deletedObjectives.length === 0) {
      restoreContainer.style.display = "none";
      return;
    }
    restoreContainer.style.display = "block";
    deletedObjectives.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "trash-item";

      const text = document.createElement("span");
      text.className = "trash-text";
      text.textContent = item.text;

      const restoreBtn = document.createElement("button");
      restoreBtn.className = "restore-btn";
      restoreBtn.textContent = "↶ Restore";
      restoreBtn.addEventListener("click", () => {
        restoreObjective(index);
      });

      li.appendChild(text);
      li.appendChild(restoreBtn);
      trashList.appendChild(li);
    });
  };

  const showRestore = () => {
    if (!restoreContainer) return;
    renderTrashList();
    // auto-clear after 15s
    if (restoreTimer) clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => {
      clearTrash();
    }, 15000);
  };

  const hideRestore = () => {
    if (!restoreContainer) return;
    restoreContainer.style.display = "none";
  };

  const clearTrash = () => {
    deletedObjectives = [];
    saveTrash();
    hideRestore();
    if (restoreTimer) {
      clearTimeout(restoreTimer);
      restoreTimer = null;
    }
  };

  const restoreObjective = (index) => {
    if (index < 0 || index >= deletedObjectives.length) return;
    const restoredGoal = deletedObjectives[index];
    // re-add to goals
    goals.push(restoredGoal);
    // remove from trash
    deletedObjectives.splice(index, 1);
    saveGoals();
    saveTrash();
    renderGoals();
    renderTrashList();
  };

  const loadTrash = () => {
    try {
      const t = localStorage.getItem(TRASH_STORAGE_KEY);
      if (t) {
        deletedObjectives = JSON.parse(t);
        if (deletedObjectives.length > 0) {
          showRestore();
        }
      }
    } catch (e) {
      deletedObjectives = [];
    }
  };

  if (clearTrashBtn) clearTrashBtn.addEventListener("click", clearTrash);

  const addNewGoal = () => {
    const text = goalInput.value.trim();
    const description = goalDescriptionInput.value.trim();
    
    if (text) {
      const newGoal = { 
        id: Date.now(), 
        text: text, 
        description: description,
        progress: 0 
      };
      goals.push(newGoal);
      goalInput.value = "";
      goalDescriptionInput.value = "";
      saveGoals();
      renderGoals();
    }
  };

  const updateGoalProgress = (id, progress) => {
    const goal = goals.find((g) => g.id === id);
    if (goal) {
      goal.progress = parseInt(progress, 10);
      saveGoals();
      renderGoals();
    }
  };

  const deleteGoal = (id) => {
    // find and save the deleted goal to allow restore
    const goalToDelete = goals.find((g) => g.id === id);
    if (goalToDelete) {
      // clone to avoid mutating any in-memory references
      const clonedGoal = Object.assign({}, goalToDelete);
      // add to front of trash array (most recent first)
      deletedObjectives.unshift(clonedGoal);
      // keep only the last MAX_TRASH_ITEMS
      if (deletedObjectives.length > MAX_TRASH_ITEMS) {
        deletedObjectives = deletedObjectives.slice(0, MAX_TRASH_ITEMS);
      }
      saveTrash();
      showRestore();
    }
    goals = goals.filter((g) => g.id !== id);
    saveGoals();
    renderGoals();
  };

  // --- Event Listeners ---
  newAdviceBtn.addEventListener("click", fetchAdvice);
  addGoalBtn.addEventListener("click", addNewGoal);
  goalInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addNewGoal();
    }
  });

  // Allow Shift+Enter in description field
  goalDescriptionInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addNewGoal();
    }
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      fetchMedia(e.target.dataset.filter);
    });
  });

  // --- Initial Load ---
  fetchAdvice();
  fetchArticles();
  fetchMedia();
  loadGoals();
  loadTrash();
});
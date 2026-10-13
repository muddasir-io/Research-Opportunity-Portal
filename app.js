// Frontend Application Script for Research Opportunity Portal
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = '/api/opportunities';
  
  // State management
  let opportunities = [];
  let selectedOpportunityId = null;

  // DOM Elements
  const gridContainer = document.getElementById('opportunities-grid');
  const loadingSpinner = document.getElementById('loading-spinner');
  const emptyState = document.getElementById('empty-state');
  const countBadge = document.getElementById('opportunity-count-badge');
  const toastContainer = document.getElementById('toast-container');
  
  // Hero Stats
  const statTotal = document.getElementById('stat-total');
  const statOpen = document.getElementById('stat-open');
  const statClosed = document.getElementById('stat-closed');

  // Search & Filter
  const searchInput = document.getElementById('search-input');
  const filterStatus = document.getElementById('filter-status');
  const filterDepartment = document.getElementById('filter-department');
  const btnRefresh = document.getElementById('btn-refresh');

  // Modals
  const modalForm = document.getElementById('modal-form');
  const modalDetails = document.getElementById('modal-details');
  const modalDelete = document.getElementById('modal-delete');
  
  // Buttons
  const btnCreateOpen = document.getElementById('btn-create-open');
  const btnEmptyCreate = document.getElementById('btn-empty-create');
  const btnCloseForm = document.getElementById('btn-close-form');
  const btnCancelForm = document.getElementById('btn-cancel-form');
  const btnCloseDetails = document.getElementById('btn-close-details');
  const btnCloseDelete = document.getElementById('btn-close-delete');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  // Form Elements
  const opportunityForm = document.getElementById('opportunity-form');
  const modalFormTitle = document.getElementById('modal-form-title');
  const formId = document.getElementById('form-id');
  const formTitle = document.getElementById('form-title');
  const formDescription = document.getElementById('form-description');
  const formArea = document.getElementById('form-area');
  const formDepartment = document.getElementById('form-department');
  const formFaculty = document.getElementById('form-faculty');
  const formPositions = document.getElementById('form-positions');
  const formDeadline = document.getElementById('form-deadline');
  const formStatus = document.getElementById('form-status');
  const formSkills = document.getElementById('form-skills');

  // Details Modal Body
  const detailsBody = document.getElementById('details-body');
  const detailsFooter = document.getElementById('details-footer');
  const deleteTitle = document.getElementById('delete-opportunity-title');

  // -------------------------------------------------------------------
  // EVENT LISTENERS
  // -------------------------------------------------------------------
  
  // Load data on page load
  fetchOpportunities();

  // Search & Filter Listeners
  searchInput.addEventListener('input', applyFilters);
  filterStatus.addEventListener('change', applyFilters);
  filterDepartment.addEventListener('change', applyFilters);
  btnRefresh.addEventListener('click', () => {
    fetchOpportunities();
    showToast('Refreshed research opportunities list', 'info');
  });

  // Modal Triggers
  btnCreateOpen.addEventListener('click', () => openCreateModal());
  btnEmptyCreate.addEventListener('click', () => openCreateModal());
  
  // Close Modals
  btnCloseForm.addEventListener('click', () => closeModal(modalForm));
  btnCancelForm.addEventListener('click', () => closeModal(modalForm));
  btnCloseDetails.addEventListener('click', () => closeModal(modalDetails));
  btnCloseDelete.addEventListener('click', () => closeModal(modalDelete));
  btnCancelDelete.addEventListener('click', () => closeModal(modalDelete));

  // Close modal on click outside content
  [modalForm, modalDetails, modalDelete].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Form Submission (Create or Edit)
  opportunityForm.addEventListener('submit', handleFormSubmit);

  // Confirm Delete
  btnConfirmDelete.addEventListener('click', handleConfirmDelete);

  // -------------------------------------------------------------------
  // API FUNCTIONS
  // -------------------------------------------------------------------

  // 1. Fetch All Opportunities
  async function fetchOpportunities() {
    try {
      showLoading(true);
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      
      const json = await res.json();
      opportunities = json.data || [];
      
      updateStats();
      applyFilters();
    } catch (err) {
      console.error('Fetch error:', err);
      showToast(`Failed to load opportunities: ${err.message}`, 'error');
      gridContainer.innerHTML = '';
      emptyState.classList.remove('hidden');
    } finally {
      showLoading(false);
    }
  }

  // 2. Fetch One Opportunity by ID
  async function fetchOpportunityById(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.error(`Error fetching ID ${id}:`, err);
      showToast(`Error: ${err.message}`, 'error');
      return null;
    }
  }

  // 3. Handle Form Submit (Create or Update)
  async function handleFormSubmit(e) {
    e.preventDefault();

    const payload = {
      title: formTitle.value.trim(),
      description: formDescription.value.trim(),
      research_area: formArea.value.trim(),
      department: formDepartment.value,
      faculty_name: formFaculty.value.trim(),
      available_positions: Number(formPositions.value),
      application_deadline: formDeadline.value,
      status: formStatus.value,
      required_skills: formSkills.value.trim()
    };

    const isEdit = Boolean(formId.value);
    const url = isEdit ? `${API_BASE}/${formId.value}` : API_BASE;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.details ? data.details.join(', ') : (data.message || 'Server operation failed');
        throw new Error(errorMsg);
      }

      showToast(isEdit ? 'Opportunity updated successfully!' : 'New research opportunity posted!', 'success');
      closeModal(modalForm);
      fetchOpportunities();
    } catch (err) {
      console.error('Save error:', err);
      showToast(err.message, 'error');
    }
  }

  // 4. Quick Status Toggle (Open <-> Closed)
  async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Open' ? 'Closed' : 'Open';
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error(`Status toggle failed (${res.status})`);

      showToast(`Opportunity status changed to '${newStatus}'`, 'success');
      fetchOpportunities();
      
      // If details modal is open, refresh it
      if (!modalDetails.classList.contains('hidden') && selectedOpportunityId === id) {
        openDetailsModal(id);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // 5. Handle Confirm Delete
  async function handleConfirmDelete() {
    if (!selectedOpportunityId) return;

    try {
      const res = await fetch(`${API_BASE}/${selectedOpportunityId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error(`Delete failed with status ${res.status}`);

      showToast('Opportunity deleted successfully', 'success');
      closeModal(modalDelete);
      closeModal(modalDetails);
      fetchOpportunities();
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.message, 'error');
    }
  }

  // -------------------------------------------------------------------
  // RENDERING & FILTERING
  // -------------------------------------------------------------------

  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const statusVal = filterStatus.value;
    const deptVal = filterDepartment.value;

    const filtered = opportunities.filter(opp => {
      const matchesSearch = !searchTerm || 
        opp.title.toLowerCase().includes(searchTerm) ||
        opp.description.toLowerCase().includes(searchTerm) ||
        opp.faculty_name.toLowerCase().includes(searchTerm) ||
        opp.research_area.toLowerCase().includes(searchTerm) ||
        opp.required_skills.toLowerCase().includes(searchTerm);

      const matchesStatus = !statusVal || opp.status === statusVal;
      const matchesDept = !deptVal || opp.department === deptVal;

      return matchesSearch && matchesStatus && matchesDept;
    });

    renderGrid(filtered);
  }

  function renderGrid(list) {
    countBadge.textContent = list.length;
    gridContainer.innerHTML = '';

    if (list.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    list.forEach(opp => {
      const card = document.createElement('div');
      card.className = 'card';
      
      const skillsArray = opp.required_skills
        ? opp.required_skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const skillsHTML = skillsArray.slice(0, 4).map(skill => 
        `<span class="skill-chip">${escapeHTML(skill)}</span>`
      ).join('');

      const extraSkillsCount = skillsArray.length > 4 ? `<span class="skill-chip">+${skillsArray.length - 4} more</span>` : '';

      const formattedDeadline = opp.application_deadline ? new Date(opp.application_deadline).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      }) : 'N/A';

      card.innerHTML = `
        <div>
          <div class="card-header">
            <h3 class="card-title">${escapeHTML(opp.title)}</h3>
            <span class="status-tag ${opp.status.toLowerCase()}">${opp.status}</span>
          </div>

          <div class="card-meta">
            <div class="meta-item"><i class="fa-solid fa-user-tie"></i> ${escapeHTML(opp.faculty_name)}</div>
            <div class="meta-item"><i class="fa-solid fa-building-columns"></i> ${escapeHTML(opp.department)}</div>
            <div class="meta-item"><i class="fa-solid fa-lightbulb"></i> ${escapeHTML(opp.research_area)}</div>
          </div>

          <p class="card-description">${escapeHTML(opp.description)}</p>

          <div class="card-skills">
            ${skillsHTML}
            ${extraSkillsCount}
          </div>
        </div>

        <div class="card-footer">
          <div class="meta-item" title="Positions Available / Deadline">
            <i class="fa-solid fa-users"></i> ${opp.available_positions} Pos &bull; <i class="fa-regular fa-calendar"></i> ${formattedDeadline}
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm btn-icon btn-view" title="View Details" data-id="${opp.id}">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="btn btn-secondary btn-sm btn-icon btn-edit" title="Edit Opportunity" data-id="${opp.id}">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn ${opp.status === 'Open' ? 'btn-secondary' : 'btn-primary'} btn-sm btn-icon btn-toggle-status" title="Toggle Status (Open/Closed)" data-id="${opp.id}" data-status="${opp.status}">
              <i class="fa-solid ${opp.status === 'Open' ? 'fa-lock' : 'fa-lock-open'}"></i>
            </button>
            <button class="btn btn-danger btn-sm btn-icon btn-delete" title="Delete" data-id="${opp.id}" data-title="${escapeHTML(opp.title)}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;

      // Event delegation inside card
      card.querySelector('.btn-view').addEventListener('click', () => openDetailsModal(opp.id));
      card.querySelector('.btn-edit').addEventListener('click', () => openEditModal(opp));
      card.querySelector('.btn-toggle-status').addEventListener('click', () => toggleStatus(opp.id, opp.status));
      card.querySelector('.btn-delete').addEventListener('click', () => openDeleteModal(opp.id, opp.title));

      gridContainer.appendChild(card);
    });
  }

  function updateStats() {
    statTotal.textContent = opportunities.length;
    statOpen.textContent = opportunities.filter(o => o.status === 'Open').length;
    statClosed.textContent = opportunities.filter(o => o.status === 'Closed').length;
  }

  // -------------------------------------------------------------------
  // MODAL CONTROLLERS
  // -------------------------------------------------------------------

  function openCreateModal() {
    opportunityForm.reset();
    formId.value = '';
    modalFormTitle.innerHTML = '<i class="fa-solid fa-folder-plus"></i> Post Research Opportunity';
    formDeadline.value = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    openModal(modalForm);
  }

  function openEditModal(opp) {
    formId.value = opp.id;
    modalFormTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Opportunity #${opp.id}`;
    
    formTitle.value = opp.title;
    formDescription.value = opp.description;
    formArea.value = opp.research_area;
    formDepartment.value = opp.department;
    formFaculty.value = opp.faculty_name;
    formPositions.value = opp.available_positions;
    formDeadline.value = opp.application_deadline ? opp.application_deadline.substring(0, 10) : '';
    formStatus.value = opp.status;
    formSkills.value = opp.required_skills;

    openModal(modalForm);
  }

  async function openDetailsModal(id) {
    selectedOpportunityId = id;
    detailsBody.innerHTML = `<div class="spinner-container"><div class="spinner"></div><p>Loading details...</p></div>`;
    openModal(modalDetails);

    const opp = await fetchOpportunityById(id);
    if (!opp) {
      closeModal(modalDetails);
      return;
    }

    const formattedDeadline = opp.application_deadline ? new Date(opp.application_deadline).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : 'N/A';

    const skillsArray = opp.required_skills
      ? opp.required_skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    detailsBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
        <h2 style="font-size: 1.4rem; font-weight: 800; color: #fff;">${escapeHTML(opp.title)}</h2>
        <span class="status-tag ${opp.status.toLowerCase()}">${opp.status}</span>
      </div>

      <div class="details-meta-grid">
        <div>
          <div class="details-label">Faculty Supervisor</div>
          <div class="details-value"><i class="fa-solid fa-user-tie"></i> ${escapeHTML(opp.faculty_name)}</div>
        </div>
        <div>
          <div class="details-label">Department</div>
          <div class="details-value"><i class="fa-solid fa-building-columns"></i> ${escapeHTML(opp.department)}</div>
        </div>
        <div>
          <div class="details-label">Research Area</div>
          <div class="details-value"><i class="fa-solid fa-lightbulb"></i> ${escapeHTML(opp.research_area)}</div>
        </div>
        <div>
          <div class="details-label">Available Positions</div>
          <div class="details-value"><i class="fa-solid fa-users"></i> ${opp.available_positions} Vacancies</div>
        </div>
        <div>
          <div class="details-label">Application Deadline</div>
          <div class="details-value"><i class="fa-regular fa-calendar"></i> ${formattedDeadline}</div>
        </div>
        <div>
          <div class="details-label">Database Record ID</div>
          <div class="details-value">#${opp.id}</div>
        </div>
      </div>

      <div>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">Description</h4>
        <p style="color: var(--color-text-muted); line-height: 1.7; font-size: 0.95rem;">${escapeHTML(opp.description)}</p>
      </div>

      <div>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">Required Skills & Technologies</h4>
        <div class="card-skills">
          ${skillsArray.map(s => `<span class="skill-chip">${escapeHTML(s)}</span>`).join('')}
        </div>
      </div>
    `;

    detailsFooter.innerHTML = `
      <button type="button" class="btn ${opp.status === 'Open' ? 'btn-secondary' : 'btn-primary'}" id="btn-modal-toggle">
        <i class="fa-solid ${opp.status === 'Open' ? 'fa-lock' : 'fa-lock-open'}"></i> ${opp.status === 'Open' ? 'Close Opportunity' : 'Re-open Opportunity'}
      </button>
      <button type="button" class="btn btn-secondary" id="btn-modal-edit">
        <i class="fa-solid fa-pen-to-square"></i> Edit
      </button>
      <button type="button" class="btn btn-danger" id="btn-modal-delete">
        <i class="fa-solid fa-trash"></i> Delete
      </button>
    `;

    document.getElementById('btn-modal-toggle').addEventListener('click', () => toggleStatus(opp.id, opp.status));
    document.getElementById('btn-modal-edit').addEventListener('click', () => {
      closeModal(modalDetails);
      openEditModal(opp);
    });
    document.getElementById('btn-modal-delete').addEventListener('click', () => {
      closeModal(modalDetails);
      openDeleteModal(opp.id, opp.title);
    });
  }

  function openDeleteModal(id, title) {
    selectedOpportunityId = id;
    deleteTitle.textContent = `"${title}" (ID: #${id})`;
    openModal(modalDelete);
  }

  function openModal(modal) {
    modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
  }

  // Helper Utilities
  function showLoading(isLoading) {
    if (isLoading) {
      loadingSpinner.classList.remove('hidden');
      gridContainer.classList.add('hidden');
      emptyState.classList.add('hidden');
    } else {
      loadingSpinner.classList.add('hidden');
      gridContainer.classList.remove('hidden');
    }
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info');
    
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <i class="fa-solid ${icon}" style="font-size: 1.2rem;"></i>
        <span class="toast-message">${escapeHTML(message)}</span>
      </div>
      <button style="background:none; border:none; color: inherit; cursor:pointer;" onclick="this.parentElement.remove()">&times;</button>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4000);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});

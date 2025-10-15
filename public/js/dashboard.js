// dashboard.js - EasySmart IoT Dashboard
// Gerenciamento de dispositivos e entidades

// Estado global
const state = {
  token: null,
  devices: [],
  templates: [],
  user: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticação
  state.token = localStorage.getItem('token');
  if (!state.token) {
    window.location.href = '/login';
    return;
  }

  // Inicializar
  init();
});

// Função principal de inicialização
async function init() {
  try {
    // Carregar templates
    await loadTemplates();
    
    // Carregar devices
    await loadDevices();
    
    // Setup event listeners
    setupEventListeners();
    
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Erro ao inicializar dashboard', 'danger');
  }
}

// Carregar templates disponíveis
async function loadTemplates() {
  try {
    const response = await fetch('/api/devices/templates', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await response.json();
    state.templates = data.templates;

    // Preencher select do modal
    const select = document.getElementById('deviceType');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    state.templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.type;
      option.textContent = `${template.icon} ${template.name}`;
      option.dataset.description = template.description;
      option.dataset.discoveryMode = template.discovery_mode;
      select.appendChild(option);
    });

  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

// Carregar devices do usuário
async function loadDevices() {
  showLoading(true);
  
  try {
    const response = await fetch('/api/devices', {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (response.status === 401) {
      handleUnauthorized();
      return;
    }

    const data = await response.json();
    state.devices = data.devices || [];

    // Atualizar UI
    updateDeviceCount(data);
    renderDevices();

  } catch (error) {
    console.error('Error loading devices:', error);
    showToast('Erro ao carregar dispositivos', 'danger');
  } finally {
    showLoading(false);
  }
}

// Renderizar devices no grid
function renderDevices() {
  const grid = document.getElementById('devicesGrid');
  const emptyState = document.getElementById('emptyState');

  if (state.devices.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('d-none');
    return;
  }

  emptyState.classList.add('d-none');
  grid.innerHTML = '';

  state.devices.forEach(device => {
    const card = createDeviceCard(device);
    grid.appendChild(card);
  });
}

// Criar card de device
function createDeviceCard(device) {
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';

  const statusClass = device.status === 'online' ? 'status-online' : 'status-offline';
  const statusText = device.status === 'online' ? 'Online' : 'Offline';
  const cardClass = device.status === 'online' ? '' : 'offline';

  col.innerHTML = `
    <div class="card device-card ${cardClass}" data-device-id="${device.id}">
      <!-- Header -->
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-0">${getDeviceIcon(device.type)} ${device.name}</h6>
            ${device.location ? `<small class="opacity-75">${device.location}</small>` : ''}
          </div>
          <span class="status-badge ${statusClass}">
            <span class="status-indicator"></span>
            ${statusText}
          </span>
        </div>
      </div>

      <!-- Body -->
      <div class="card-body">
        <div id="entities-${device.id}" class="entities-container">
          <div class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
            <small class="d-block mt-2 text-muted">Carregando entidades...</small>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="card-footer">
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">
            ${device.entities_count || 0} entidade(s)
          </small>
          <div>
            <button class="btn btn-sm btn-outline-primary" onclick="editDevice(${device.id})">
              ✏️ Editar
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteDevice(${device.id}, '${device.name}')">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Carregar entidades do device
  loadDeviceEntities(device.id);

  return col;
}

// Carregar entidades de um device
async function loadDeviceEntities(deviceId) {
  try {
    const response = await fetch(`/api/devices/${deviceId}/entities`, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (!response.ok) throw new Error('Failed to load entities');

    const data = await response.json();
    renderDeviceEntities(deviceId, data.entities);

  } catch (error) {
    console.error(`Error loading entities for device ${deviceId}:`, error);
    document.getElementById(`entities-${deviceId}`).innerHTML = `
      <small class="text-danger">Erro ao carregar entidades</small>
    `;
  }
}

// Renderizar entidades de um device
function renderDeviceEntities(deviceId, entities) {
  const container = document.getElementById(`entities-${deviceId}`);
  
  if (!entities || entities.length === 0) {
    container.innerHTML = '<small class="text-muted">Nenhuma entidade cadastrada</small>';
    return;
  }

  container.innerHTML = '';

  entities.forEach(entity => {
    const entityEl = createEntityElement(deviceId, entity);
    container.appendChild(entityEl);
  });
}

// Criar elemento de entidade
function createEntityElement(deviceId, entity) {
  const div = document.createElement('div');
  div.className = 'entity-item';

  const icon = entity.icon || getEntityIcon(entity.entity_type);
  const value = entity.value ? JSON.parse(entity.value) : {};

  if (entity.entity_type === 'switch') {
    // Switch/Toggle
    const isChecked = value.state ? 'checked' : '';
    div.innerHTML = `
      <div class="d-flex align-items-center flex-grow-1">
        <span class="entity-icon">${icon}</span>
        <span class="entity-name">${entity.name}</span>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" ${isChecked}
               onchange="toggleEntity(${deviceId}, '${entity.entity_id}', this.checked)">
      </div>
    `;
  } else if (entity.entity_type === 'sensor') {
    // Sensor (read-only)
    const sensorValue = value.value !== undefined ? value.value : 0;
    const badgeClass = getSensorBadgeClass(entity.entity_id, sensorValue);
    div.innerHTML = `
      <div class="d-flex align-items-center flex-grow-1">
        <span class="entity-icon">${icon}</span>
        <div class="entity-info">
          <div class="entity-name">${entity.name}</div>
        </div>
      </div>
      <span class="sensor-badge ${badgeClass}">
        ${sensorValue}${entity.unit ? ' ' + entity.unit : ''}
      </span>
    `;
  } else {
    // Outros tipos (text, number, binary_sensor)
    const displayValue = value.value !== undefined ? value.value : value.state !== undefined ? value.state : '-';
    div.innerHTML = `
      <div class="d-flex align-items-center flex-grow-1">
        <span class="entity-icon">${icon}</span>
        <span class="entity-name">${entity.name}</span>
      </div>
      <span class="entity-value">${displayValue}${entity.unit ? ' ' + entity.unit : ''}</span>
    `;
  }

  return div;
}

// Toggle entity (switch)
async function toggleEntity(deviceId, entityId, newState) {
  try {
    const response = await fetch(`/api/devices/${deviceId}/entities/${entityId}/value`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${state.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value: newState })
    });

    if (!response.ok) throw new Error('Failed to update entity');

    showToast(`Entidade atualizada com sucesso`, 'success');

  } catch (error) {
    console.error('Error toggling entity:', error);
    showToast('Erro ao atualizar entidade', 'danger');
    // Recarregar para reverter UI
    loadDeviceEntities(deviceId);
  }
}

// Adicionar device
async function addDevice() {
  const name = document.getElementById('deviceName').value.trim();
  const deviceId = document.getElementById('deviceId').value.trim();
  const type = document.getElementById('deviceType').value;
  const location = document.getElementById('deviceLocation').value.trim();
  const discoveryMode = document.getElementById('discoveryMode').value;

  if (!name || !deviceId || !type) {
    showToast('Preencha todos os campos obrigatórios', 'warning');
    return;
  }

  const btnSave = document.getElementById('btnSaveDevice');
  const spinner = document.getElementById('saveSpinner');
  btnSave.disabled = true;
  spinner.classList.remove('d-none');

  try {
    const response = await fetch('/api/devices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        device_id: deviceId,
        type,
        location: location || null,
        discovery_mode: discoveryMode
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao criar device');
    }

    showToast('Dispositivo adicionado com sucesso!', 'success');
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalAddDevice'));
    modal.hide();
    
    // Limpar form
    document.getElementById('formAddDevice').reset();
    
    // Recarregar devices
    await loadDevices();

  } catch (error) {
    console.error('Error adding device:', error);
    document.getElementById('addDeviceError').textContent = error.message;
    document.getElementById('addDeviceError').classList.remove('d-none');
  } finally {
    btnSave.disabled = false;
    spinner.classList.add('d-none');
  }
}

// Deletar device
async function deleteDevice(id, name) {
  if (!confirm(`Tem certeza que deseja deletar "${name}"?\n\nTodas as entidades serão removidas.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/devices/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.token}` }
    });

    if (!response.ok) throw new Error('Failed to delete device');

    showToast(`Device "${name}" deletado com sucesso`, 'success');
    await loadDevices();

  } catch (error) {
    console.error('Error deleting device:', error);
    showToast('Erro ao deletar device', 'danger');
  }
}

// Editar device (placeholder)
function editDevice(id) {
  showToast('Função de edição em desenvolvimento', 'info');
}

// Setup event listeners
function setupEventListeners() {
  // Logout
  document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  });

  // Refresh
  document.getElementById('btnRefresh').addEventListener('click', () => {
    loadDevices();
  });

  // Save device
  document.getElementById('btnSaveDevice').addEventListener('click', addDevice);

  // Template change - atualizar descrição
  document.getElementById('deviceType').addEventListener('change', (e) => {
    const option = e.target.selectedOptions[0];
    const desc = document.getElementById('templateDescription');
    
    if (option.dataset.description) {
      desc.textContent = option.dataset.description;
      
      // Ajustar discovery mode padrão
      const defaultMode = option.dataset.discoveryMode || 'template';
      document.getElementById('discoveryMode').value = defaultMode;
    } else {
      desc.textContent = '';
    }

    // Limpar erro
    document.getElementById('addDeviceError').classList.add('d-none');
  });

  // Limpar modal ao fechar
  document.getElementById('modalAddDevice').addEventListener('hidden.bs.modal', () => {
    document.getElementById('formAddDevice').reset();
    document.getElementById('addDeviceError').classList.add('d-none');
    document.getElementById('templateDescription').textContent = '';
  });
}

// Helpers
function showLoading(show) {
  document.getElementById('loadingState').classList.toggle('d-none', !show);
  document.getElementById('devicesGrid').classList.toggle('d-none', show);
}

function updateDeviceCount(data) {
  const count = document.getElementById('deviceCount');
  const planBadge = document.getElementById('planBadge');
  
  count.textContent = `${data.current || 0} de ${data.limit || 0} dispositivos`;
  
  const planClass = data.plan === 'premium' ? 'plan-premium' : 'plan-free';
  planBadge.innerHTML = `<span class="plan-badge ${planClass}">${data.plan || 'free'}</span>`;
}

function showToast(message, type = 'info') {
  const toast = new bootstrap.Toast(document.getElementById('liveToast'));
  document.getElementById('toastTitle').textContent = type === 'success' ? '✅ Sucesso' : 
                                                      type === 'danger' ? '❌ Erro' : 
                                                      type === 'warning' ? '⚠️ Atenção' : 'ℹ️ Info';
  document.getElementById('toastBody').textContent = message;
  toast.show();
}

function handleUnauthorized() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}

function getDeviceIcon(type) {
  const icons = {
    compressor_monitor: '🏭',
    gate_controller: '🚪',
    hvac_sensor: '🌡️',
    relay_board: '🔌',
    energy_meter: '⚡',
    esp32_generic: '🔧'
  };
  return icons[type] || '📟';
}

function getEntityIcon(type) {
  const icons = {
    switch: '🔌',
    sensor: '📊',
    number: '🔢',
    text: '📝',
    binary_sensor: '🔘'
  };
  return icons[type] || '📌';
}

function getSensorBadgeClass(entityId, value) {
  // Lógica simples de thresholds
  const thresholds = {
    temp_oil: { warning: 90, danger: 100 },
    pressure: { warning: 150, danger: 180 },
    vibration: { warning: 5, danger: 8 }
  };

  const limits = thresholds[entityId];
  if (!limits) return 'bg-secondary';
  
  if (value >= limits.danger) return 'bg-danger';
  if (value >= limits.warning) return 'bg-warning';
  return 'bg-success';
}

// Expor funções globais necessárias
window.toggleEntity = toggleEntity;
window.deleteDevice = deleteDevice;
window.editDevice = editDevice;

const token = sessionStorage.getItem('token');
if (!token) window.location.href = '/login.html';

const serverTabsElem = document.getElementById('nav-tab');
const tabContentElem = document.getElementById('nav-tabContent');
let username = "";

// Utility function to convert newlines to <br>
const convertNewlinesToBr = str => str.replace(/\n/g, '<br>');

// Fetch user information
fetch('/user-info', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(response => response.json())
  .then(data => {
    username = data.username;
    console.log('User info:', data);
  })
  .catch(error => console.error('Error fetching user info:', error));

// Fetch server list and create tabs and content
fetch('/servers', {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(response => response.json())
  .then(servers => {
    console.log('Servers:', servers);
    servers.forEach((server, index) => {
      const isActive = index === 0 ? 'active' : '';

      // Create tab
      serverTabsElem.innerHTML += `
        <button class="nav-link ${isActive} col-md-1 col-3 p-1" id="nav-${server.name}-tab" data-bs-toggle="tab" data-bs-target="#nav-${server.name}" type="button" role="tab" aria-controls="nav-${server.name}" aria-selected="${isActive ? 'true' : 'false'}">
          ${server.name}
        </button>
      `;

      // Create tab content
      tabContentElem.innerHTML += `
        <div class="tab-pane fade ${isActive ? 'show active' : ''}" id="nav-${server.name}" role="tabpanel" aria-labelledby="nav-${server.name}-tab">
          <div id="consoleOutput-${server.name}" class="console-output w-100"></div>
          <form id="commandForm-${server.name}" class="command-form row mx-auto d-flex justify-content-between col-12 p-0 mb-20" style="height: 40px">
            <div class="form-group col-md-11 col-10 p-0 h-100 m-0">
              <input type="text" class="form-control command-input h-100" placeholder="Enter command" required style="background:#1e1e1e;">
            </div>
            <button type="submit" class="nk-btn nk-btn-rounded nk-btn-color-dark-3 nk-btn-hover-color-main-1 col-md-1 col-2 p-2 h-100">Send</button>
          </form>
        </div>
      `;

      // Add event listener to form
      document.getElementById(`commandForm-${server.name}`).addEventListener('submit', async (e) => {
        e.preventDefault();
        const commandInput = e.target.querySelector('.command-input');
        const command = commandInput.value;
        const timestamp = new Date().toLocaleString();
        const consoleOutputElem = document.getElementById(`consoleOutput-${server.name}`);

        consoleOutputElem.innerHTML += `<p>[${timestamp}] ${username} initiated Command: ${command}</p>`;

        try {
          const response = await fetch('/send-command', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ command, serverName: server.name }),
          });

          if (!response.ok) throw new Error(`Network response was not ok. Status: ${response.status} ${response.statusText}`);

          const data = await response.json();
          const message = data.response ? convertNewlinesToBr(data.response) : data.error ? data.error : 'Unknown error';
          consoleOutputElem.innerHTML += `<p>${message}</p>`;
        } catch (error) {
          consoleOutputElem.innerHTML += `<p>Error: ${error.message}</p>`;
        }

        commandInput.value = ''; // Clear the input field
      });
    });
  })
  .catch(error => console.error('Error fetching servers:', error));

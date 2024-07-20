var preloaderInit = function preloaderInit() {
  var preloader = document.querySelector('.preloader');
  setTimeout(function () {
    preloader?.classList.add('loaded');
    setTimeout(function () {
      preloader?.remove();
    }, 0); // Remove preloader immediately after setting it to 'loaded'
  }, 3000); // Keep the preloader for 5 seconds
};

function convertNewlinesToBr(str) {
  return str.replace(/\n/g, '<br>');
}

const token = sessionStorage.getItem('token');
if (!token) {
  window.location.href = '/index.html';
}

const serverTabsElem = document.getElementById('nav-tab');
const tabContentElem = document.getElementById('nav-tabContent');
let username = "";

// Fetch user information
fetch('https://admin.zlg.gg/user-info', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})
  .then((response) => response.json())
  .then((data) => {
    username = data.username;
    console.log('User info:', data);
  })
  .catch((error) => console.error('Error fetching user info:', error));

// Fetch server list from backend
fetch('https://admin.zlg.gg/servers', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})
  .then((response) => response.json())
  .then((servers) => {
    console.log('Servers:', servers);
    servers.forEach((server, index) => {
      const isActive = index === 0 ? 'active' : '';

      // Create tab
      const tabItem = document.createElement('button');
      tabItem.className = `nav-link ${isActive} col-md-1 col-3 p-1`;
      tabItem.id = `nav-${server.name}-tab`;
      tabItem.dataset.bsToggle = 'tab';
      tabItem.dataset.bsTarget = `#nav-${server.name}`;
      tabItem.type = 'button';
      tabItem.role = 'tab';
      tabItem.ariaControls = `nav-${server.name}`;
      tabItem.ariaSelected = isActive ? 'true' : 'false';
      tabItem.textContent = server.name;
      serverTabsElem.appendChild(tabItem);

      // Create tab content
      const tabPane = document.createElement('div');
      tabPane.className = `tab-pane fade ${isActive ? 'show active' : ''}`;
      tabPane.id = `nav-${server.name}`;
      tabPane.role = 'tabpanel';
      tabPane.ariaLabelledby = `nav-${server.name}-tab`;

      tabPane.innerHTML = `
        <div id="consoleOutput-${server.name}" class="console-output w-100"></div>
        <form id="commandForm-${server.name}" class="command-form row mx-auto d-flex justify-content-between col-12 p-0 mb-20" style="height: 40px">
          <div class="form-group col-md-11 col-10 p-0 h-100 m-0">
            <input type="text" class="form-control command-input h-100" placeholder="Enter command" required style="background:#1e1e1e;">
          </div>
          <button type="submit" class="nk-btn nk-btn-rounded nk-btn-color-dark-3 nk-btn-hover-color-main-1 col-md-1 col-2 p-2 h-100">Send</button>
        </form>
      `;
      tabContentElem.appendChild(tabPane);

      // Add event listener to form
      const commandForm = tabPane.querySelector('.command-form');
      const consoleOutputElem = tabPane.querySelector('.console-output');
      commandForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const commandInput = commandForm.querySelector('.command-input');
        const command = commandInput.value;

        const timestamp = new Date().toLocaleString();
        consoleOutputElem.innerHTML += `<p>[${timestamp}] ${username} initiated Command: ${command}</p>`;

        try {
          const response = await fetch('https://admin.zlg.gg/send-command', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ command, serverName: server.name }),
          });

          if (!response.ok) {
            throw new Error(`Network response was not ok. Status: ${response.status} ${response.statusText}`);
          }

          const data = await response.json(); // Parse the JSON response

          // Display response in the console output
          if (data.response) {
            const formattedResponse = convertNewlinesToBr(data.response);
            consoleOutputElem.innerHTML += `<p>Response: ${formattedResponse}</p>`;
          } else if (data.error) {
            consoleOutputElem.innerHTML += `<p>Error: ${data.error}</p>`;
          } else {
            consoleOutputElem.innerHTML += `<p>Unknown error</p>`;
          }
        } catch (error) {
          consoleOutputElem.innerHTML += `<p>Error: ${error.message}</p>`;
        }

        commandInput.value = ''; // Clear the input field
      });
    });
  })
  .catch((error) => console.error('Error fetching servers:', error));

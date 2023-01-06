let resources = [];

// Load the statistics list
window.onload = function() {
  console.log("Script loaded");
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
      const statistics = JSON.parse(xhr.responseText).result;
      const select = document.getElementById("statistic");
      for (const statistic of statistics) {
        select.options.add(new Option(statistic, statistic));
      }
    }
  };
  xhr.open("GET", "https://api.nationalgrideso.com/api/3/action/package_list");
  xhr.send();
};

function loadResources(statisticId) {
  // Clear any existing resource options
  document.getElementById("resource").innerHTML = '<option disabled selected value="">-- select an option --</option>';
  // Make an HTTP request to get the data for the selected statistic
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `https://data.nationalgrideso.com/api/3/action/package_show?id=${statisticId}`);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      const data = JSON.parse(xhr.responseText);

      // Find all the resources
      resources = data.result.resources;
      console.log(resources);

      // Populate the resource dropdown with the resources
      const select = document.getElementById("resource");
      for (const resource of resources) {
        select.options.add(new Option(`${resource.name} (${resource.format})`, resource.id));
      }

      // Reset the stastic container
      document.getElementById("statistic-meta").innerHTML = "<h2>Statistic Information</h2>"

      // Populate the stastic container with package information for the current statistic
      const statisticMeta = data.result
      console.log(statisticMeta);

      // Display meta information for the current statistic
      // Build the table
      const table = document.createElement('table');
      table.className = "meta-table";
      const tbody = document.createElement('tbody');
      table.appendChild(tbody);

      // Add a row for each statisticMeta property
      for (const property in statisticMeta) {
        if (statisticMeta.hasOwnProperty(property)) {
          const tr = document.createElement('tr');
          const attributeTd = document.createElement('td');
          attributeTd.textContent = property;
          tr.appendChild(attributeTd);
          const valueTd = document.createElement('td');
          valueTd.textContent = statisticMeta[property];
          tr.appendChild(valueTd);
          tbody.appendChild(tr);
        }
      }

      // Add the table to the page
      document.getElementById("statistic-meta").appendChild(table);

    }
  };
  xhr.send();
}


function loadData(resourceId) {
  // Reset the meta container
  document.getElementById("resource-meta").innerHTML = "<h2>Resource Information</h2>";
  // Find the resource object
  const resource = resources.find(res => res.id === resourceId);
  console.log("Loading data for resource [" + resourceId + "]");
  console.log(resource.url);

  // Display meta information for the current resource
  // Build the table
  const table = document.createElement('table');
  table.className = "meta-table";
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  // Add a row for each resource property
  for (const property in resource) {
    if (resource.hasOwnProperty(property)) {
      const tr = document.createElement('tr');
      const attributeTd = document.createElement('td');
      attributeTd.textContent = property;
      tr.appendChild(attributeTd);
      const valueTd = document.createElement('td');
      valueTd.textContent = resource[property];
      tr.appendChild(valueTd);
      tbody.appendChild(tr);
    }
  }

  // Add the table to the page
  document.getElementById("resource-meta").appendChild(table);

  // Display the loading message
  document.getElementById("data").innerHTML = "<br>Loading data, please wait...";
  // Make an HTTP request to get the data for the selected resource
  const xhr = new XMLHttpRequest();
  // Note: We have to use a CORS proxy because the server that is hosting the CSV files we are trying to access (https://storage.googleapis.com) is not currently set up to allow "Cross-Origin Requests". To allow our web app to access data from a different origin, the server hosting the data must include the appropriate CORS (Cross-Origin Resource Sharing) headers in its responses. Without these headers, the browser will block the request.
  xhr.open('GET', "https://corsproxy.io/?" + resource.url);

  xhr.onreadystatechange = function() {
    console.log("State: " + xhr.readyState + " URL:" + xhr.responseURL + " Format:" + resource.format);
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {

      // If the resource is a CSV file, parse and display it as a table
      if (resource.format.toLowerCase() === 'csv') {
        // Parse the CSV data
        let rows = xhr.responseText.split('\n');
        // Remove the extra row with a single empty cell from the end of the table
        rows = rows.filter(row => row.trim() !== '');
        const headings = rows[0].split(',');
        const data = rows.slice(1).map(row => row.split(','));

        console.log(headings);

        // Build the table
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        table.appendChild(thead);
        table.appendChild(tbody);

        // Add the headings
        const tr = document.createElement('tr');
        headings.forEach(heading => {
          const th = document.createElement('th');
          th.textContent = heading;
          tr.appendChild(th);
        });
        thead.appendChild(tr);

        // Add the data rows
        data.forEach(row => {
          const tr = document.createElement('tr');
          row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });

        // Add the table to the page
        const container = document.getElementById('data');
        container.innerHTML = "<h2>Data</h2>";
        container.appendChild(table);

      } else if (resource.format.toLowerCase() === 'png') {

        // If the resource is an image, display it
        const img = document.createElement('img');
        img.src = resource.url;
        const container = document.getElementById('data');
        container.innerHTML = "<h2>Image</h2>";
        container.appendChild(img);

      } else {

        // If the resource is not a CSV or image, display it as a link
        const container = document.getElementById('data');
        container.innerHTML = "<h2>Download Link</h2>";

        const a = document.createElement('a');
        a.href = resource.url;
        a.textContent = resource.url;
        a.target = '_blank';
        container.appendChild(a);

      }
    }
  };
  xhr.send();
}
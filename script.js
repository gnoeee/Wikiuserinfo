const projectSelect = document.getElementById('projectSelect');
const monthSelect = document.getElementById('month');
const daySelect = document.getElementById('day');
const activitySelect = document.getElementById('activityFilter');
const userGrid = document.getElementById('userGrid');
const summary = document.getElementById('summary');

let projects = [];
let usersData = [];

// Populate month and day selects
for(let i=1;i<=12;i++){
  const option = document.createElement('option');
  option.value = i;
  option.text = new Date(0,i-1).toLocaleString('default',{month:'long'});
  monthSelect.appendChild(option);
}
monthSelect.value = new Date().getMonth()+1;
for(let i=1;i<=31;i++){
  const option = document.createElement('option');
  option.value = i;
  option.text = i;
  daySelect.appendChild(option);
}
daySelect.value = new Date().getDate();

function formatDate(ts){
  if(!ts || ts.length < 8) return 'N/A';
  const year = ts.substring(0,4);
  const month = parseInt(ts.substring(4,6))-1;
  const day = parseInt(ts.substring(6,8));
  const d = new Date(year, month, day);
  return d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
}

function calculateYears(ts){
  if(!ts || ts.length < 8) return 0;
  const year = parseInt(ts.substring(0,4));
  const month = parseInt(ts.substring(4,6))-1;
  const day = parseInt(ts.substring(6,8));
  const firstDate = new Date(year, month, day);
  const now = new Date();
  let yrs = now.getFullYear()-firstDate.getFullYear();
  if(now.getMonth()<firstDate.getMonth()||(now.getMonth()===firstDate.getMonth()&&now.getDate()<firstDate.getDate())) yrs--;
  return yrs;
}

function getBadgeClass(years){
  if(years>=20) return 'gold';
  if(years>=10) return 'silver';
  if(years>=5) return 'bronze';
  return 'normal';
}

function render(){
  const month = parseInt(monthSelect.value);
  const day = parseInt(daySelect.value);
  const activity = activitySelect.value;
  const now = new Date();
  const selectedProject = projects[projectSelect.selectedIndex];

  const filtered = usersData.filter(u=>{
    if(!u.first_edit || u.first_edit.length<8) return false;
    const m = parseInt(u.first_edit.substring(4,6));
    const d = parseInt(u.first_edit.substring(6,8));
    if(m!==month || d!==day) return false;

    if(activity !== 'all'){
      if(!u.last_edit || u.last_edit.length<8) return false;
      const last = new Date(parseInt(u.last_edit.substring(0,4)), parseInt(u.last_edit.substring(4,6))-1, parseInt(u.last_edit.substring(6,8)));
      const monthsDiff = (now.getFullYear()-last.getFullYear())*12 + (now.getMonth()-last.getMonth());
      if(activity === 'inactive' && monthsDiff < 12) return false;
      if(activity !== 'inactive' && monthsDiff >= parseInt(activity)) return false;
    }
    return true;
  });

  userGrid.innerHTML='';
  filtered.forEach(u=>{
    const years = calculateYears(u.first_edit);
    const div = document.createElement('div');
    div.className='card';

    div.innerHTML=`
      <h3 class='username'><a href='${selectedProject.talkBase}${encodeURIComponent(u.user_name)}' target='_blank'>${u.user_name}</a></h3>
      <div class='info-section'>
        <div class='left'>
          <p><strong>First edit:</strong><br>${formatDate(u.first_edit)}</p>
          <p><strong>Last edit:</strong><br>${formatDate(u.last_edit)}</p>
        </div>
        <div class='right ${getBadgeClass(years)}'>
          <div class='badge'>${years>0?years+' '+(years===1?'yr':'yrs'):''}</div>
          <span class='total-edits'>Total edits: ${u.user_editcount.toLocaleString()}</span>
        </div>
      </div>`;

    userGrid.appendChild(div);
  });

  summary.textContent=`Showing ${filtered.length} users celebrating today in ${selectedProject.name}.`;
}

function clearFilters(){
  monthSelect.value=new Date().getMonth()+1;
  daySelect.value=new Date().getDate();
  activitySelect.value='all';
  render();
}

monthSelect.addEventListener('change', render);
daySelect.addEventListener('change', render);
activitySelect.addEventListener('change', render);
projectSelect.addEventListener('change', () => {
  fetchData(projects[projectSelect.selectedIndex].queryUrl);
});

fetch('projects.json')
  .then(res => res.json())
  .then(data => {
    projects = data;
    projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.queryUrl;
      opt.textContent = p.name;
      projectSelect.appendChild(opt);
    });
    projectSelect.selectedIndex = 0;
    fetchData(projects[0].queryUrl);
  });

function fetchData(url){
  summary.textContent='Loading...';
  fetch(url)
    .then(res=>res.json())
    .then(json=>{
      usersData = json.rows.map(r=>({
        user_name: r[0],
        user_registration: r[1],
        user_editcount: r[2],
        first_edit: r[3],
        last_edit: r[4]
      }));
      render();
    })
    .catch(err=>{
      summary.textContent='Failed to load data';
      console.error(err);
    });
}
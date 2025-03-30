const dbManager = new IndexedDBManager('todoDB', 'todos');
window.onload = () => {
    dbManager.init().catch(error => {
        console.error('IndexedDB initialization failed:', error);
    }).then(result => {
        refreshTodoList();
    });
   
};

document.getElementById('todo-form').addEventListener('submit', event => {
    event.preventDefault();
    const newTodoInput = document.getElementById('new-todo');
    const text = newTodoInput.value.trim();
    if (text) {
        addTodo(text);
        newTodoInput.value = '';
    }
});

//mark todo as complete or not
async function toggleTodoComplete(id){
    try {
        var todo = await dbManager.getById(id);
        var done = !todo.done;

        await dbManager.update(id, {text : todo.text, done : done});
        refreshTodoList()
    } catch (error) {
        showError("Failed to delete: ", error)
    }
}

//show todo list, called render
async function refreshTodoList() {
    try {
         const todos = await dbManager.getAll();
         renderTodos(todos);
    } catch (error) {
         showError('Failed to refresh todo list:', error);
    }
}


function renderTodos(todos) {
    const listElement = document.getElementById('todo-list');
    listElement.innerHTML = ''; // Clear the list
    todos.forEach(todo => {
        console.log(todo);
        var li = document.createElement('li');
        li.id = "todo" + todo.id;
        console.log(todo.done);

        var checked = todo.done ? "checked" : ""; 
        var text = todo.done ? `<strike>${todo.text}</strike>` : todo.text
        var body = `
          <div>
             <input type = "checkbox" onclick = "toggleTodoComplete(${todo.id})" ${checked}>
             <span id="todo-item${todo.id}">${text}</span> 
             <input type="text" id="input-edit${todo.id}" class="todo-input"/>

             <span class = "toolbox">
                <button value = "1" id ="button-edit${todo.id}" onclick="editTodo(${todo.id})">Edit</button>
                <button onclick="deleteTodo(${todo.id})"> Delete </button>
            </span>
          </div>
        `
        listElement.appendChild(li);
        li.innerHTML = body;
        
    });
}

//Toast an error message, 
function showError(title, message){
    var elem = document.getElementById("error-box");
    elem.style.display = "block";
    elem.innerHTML = `
        ${title} ${message}
    `
    if(typeof(timeout_handle) !== "undefined"){
        clearTimeout(timeout_handle);
    }
    

    //clear popup
    timeout_handle = setTimeout(function(){
        elem.style.display = "none";
        elem.innerHTML = "";
    }, 5000)
}

//new todo
async function addTodo(text) {
    try {
        await dbManager.add({ text : text, done : false });
        refreshTodoList();
    } catch (error) {
        showError('Failed to add todo:', error);
    }
}

//modify an existing todo item
async function editTodo(id){
    try {
        var todo = await dbManager.getById(id)
        var inp = document.getElementById("input-edit" + id);
        var btn = document.getElementById("button-edit" + id)
        if(btn.value == 1){ //edit mode
            btn.value = 0;
            inp.style.display = "inline-block";
            btn.textContent = "Save"
            inp.value = todo.text;
            inp.focus();

        } else { //display mode
            btn.value = 1;
            inp.style.display = "none";
            btn.textContent = "Edit";

            var text = inp.value;
            try {
                await dbManager.update(id, {text : text, done : todo.done});
                refreshTodoList()
            } catch (error) {
                showError("Failed cannot update: ", error);
            }
        }


    } catch (error) {
        showError("Failed to delete: ", error)
    }
}

//delete todo item, refresh the list
async function deleteTodo(id){
    try {
        await dbManager.delete(id)
        refreshTodoList()
    } catch (error) {
        showError("Failed to delete: ",  error)
    }
}


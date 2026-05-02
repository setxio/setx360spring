const apiKey = 'AIzaSyDePbOQEMXa7xC6JFGldASHxtyKLy5Gbn4';
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey)
  .then(res => res.json())
  .then(data => console.log(data.models.map(m => m.name).join('\n')));

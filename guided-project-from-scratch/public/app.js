document.addEventListener('DOMContentLoaded', () => {
  const languageInput = document.getElementById('language');
  const answerInput = document.getElementById('answer');
  const sendBtn = document.getElementById('sendBtn');
  const responseDiv = document.getElementById('response');

  sendBtn.addEventListener('click', async () => {
    const language = languageInput.value.trim();
    const answer = answerInput.value.trim();

    if (!language || !answer) {
      alert('Please enter both language and your answer.');
      return;
    }

    responseDiv.innerHTML = 'Processing your answer...';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, answer }),
      });

      const data = await response.json();

      if (response.ok) {
        responseDiv.innerHTML = `
          <p><strong>Mark:</strong> ${data.mark}/10</p>
          <p><strong>Feedback:</strong> ${data.feedback}</p>
        `;
      } else if (data.errors) {
        const errorMessages = data.errors.map(err => err.msg).join('<br>');
        responseDiv.innerHTML = `<p style="color: red;"><strong>Error:</strong><br>${errorMessages}</p>`;
      } else if (data.error) {
        responseDiv.innerHTML = `<p style="color: red;"><strong>Error:</strong> ${data.error}</p>`;
      } else {
        responseDiv.innerHTML = '<p style="color: red;">An unknown error occurred.</p>';
      }
    } catch (error) {
      console.error('Error fetching chat response:', error);
      responseDiv.innerHTML = '<p style="color: red;">An unexpected error occurred.</p>';
    }
  });
});

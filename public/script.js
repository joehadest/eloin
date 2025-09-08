document.getElementById('feedbackForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Validação básica
    const requiredFields = document.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim() && field.type !== 'radio') {
            isValid = false;
            field.style.borderColor = '#ff4444';
        } else {
            field.style.borderColor = '#333';
        }
    });

    // Validação para campos de radio obrigatórios
    const radioGroups = ['frequencia', 'rating-equipamentos', 'rating-limpeza', 'rating-atendimento', 'rating-horarios', 'como-conheceu', 'nps', 'rating'];

    radioGroups.forEach(groupName => {
        const radios = document.querySelectorAll(`input[name="${groupName}"]`);
        const isChecked = Array.from(radios).some(radio => radio.checked);
        if (!isChecked) {
            isValid = false;
            // Destacar o grupo de radio buttons
            radios.forEach(radio => {
                const label = document.querySelector(`label[for="${radio.id}"]`);
                if (label) {
                    label.style.borderColor = '#ff4444';
                    setTimeout(() => {
                        label.style.borderColor = '';
                    }, 3000);
                }
            });
        }
    });

    if (!isValid) {
        // Mostrar mensagem de erro
        const errorMessage = document.createElement('div');
        errorMessage.innerHTML = '⚠️ Por favor, preencha todos os campos obrigatórios para ajudar a Academia Eloin Fitness a melhorar.';
        errorMessage.style.cssText = `
            background: linear-gradient(145deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.2));
            border: 2px solid #ff4444;
            border-radius: 10px;
            color: #ff4444;
            font-weight: 600;
            font-size: 1rem;
            text-align: center;
            padding: 15px;
            margin-top: 20px;
            animation: fadeIn 0.5s ease-out;
        `;

        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        errorMessage.className = 'error-message';
        document.querySelector('form').appendChild(errorMessage);

        // Rolar para o primeiro campo com erro
        const firstError = document.querySelector('[required][style*="border-color: rgb(255, 68, 68)"]');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Remover mensagem de erro após 5 segundos
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.remove();
            }
        }, 5000);

        return;
    }

    // Coleta dos dados do formulário
    const formData = new FormData(event.target);
    const data = {};

    // Campos simples
    for (let [key, value] of formData.entries()) {
        if (key === 'atividades') {
            if (!data[key]) data[key] = [];
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }

    // Aqui você pode enviar os dados para um servidor
    console.log('Dados do formulário:', data);

    // Enviar dados para o servidor
    fetch('/api/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(result => {
            console.log('Sucesso:', result);
            // Redirecionar para o login após envio bem-sucedido
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000); // Pequeno delay para mostrar a mensagem de sucesso
        })
        .catch(error => {
            console.error('Erro:', error);
            // Mostrar mensagem de erro
            const errorMessage = document.createElement('div');
            errorMessage.innerHTML = '❌ Erro ao enviar feedback para Academia Eloin Fitness. Tente novamente.';
            errorMessage.style.cssText = `
            background: linear-gradient(145deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.2));
            border: 2px solid #ff4444;
            border-radius: 10px;
            color: #ff4444;
            font-weight: 600;
            font-size: 1rem;
            text-align: center;
            padding: 15px;
            margin-top: 20px;
            animation: fadeIn 0.5s ease-out;
        `;
            errorMessage.className = 'error-message';
            document.querySelector('form').appendChild(errorMessage);

            // Resetar botão
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
            submitButton.style.opacity = '1';

            // Remover mensagem de erro após 5 segundos
            setTimeout(() => {
                if (errorMessage.parentNode) {
                    errorMessage.remove();
                }
            }, 5000);
        });

    // Simular envio com loading
    const submitButton = document.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;

    submitButton.innerHTML = '⏳ Enviando para Academia Eloin Fitness...';
    submitButton.disabled = true;
    submitButton.style.opacity = '0.6';

    function showSuccess() {
        const form = event.target;
        const formMessage = document.getElementById('form-message');

        // Adicionar animação de saída ao formulário
        form.style.transform = 'translateY(-20px)';
        form.style.opacity = '0';
        form.style.transition = 'all 0.5s ease-out';

        setTimeout(() => {
            form.classList.add('hidden');
            formMessage.classList.remove('hidden');

            // Animação de entrada da mensagem
            formMessage.style.transform = 'translateY(20px)';
            formMessage.style.opacity = '0';
            setTimeout(() => {
                formMessage.style.transform = 'translateY(0)';
                formMessage.style.opacity = '1';
                formMessage.style.transition = 'all 0.5s ease-out';
            }, 100);
        }, 500);

        // Resetar botão
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        submitButton.style.opacity = '1';
    }
});

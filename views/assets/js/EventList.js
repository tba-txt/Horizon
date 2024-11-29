window.sr = ScrollReveal({
    reset: true, 
  });
  
  document.addEventListener('scroll', function () {
    const elements = document.querySelectorAll('.sangue1, .sangue2, .sangue3, .sangue4, .sangue5, .sangue6, .sangue7, .sangue8, .san3, .san2, .san1, .home_mapa, .collection, .mit_info, .mit_mitos');
  
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();

      if (rect.top < window.innerHeight && rect.bottom >= 0) {
        el.classList.add('reveal'); 
      } else {
        el.classList.remove('reveal'); 
      }
    });
  });
  
  
  // Revela outros elementos
  sr.reveal('.home_locais_doacao', { duration: 3000 });
  sr.reveal('.carousel-inner', { duration: 3000 });
  sr.reveal('.home_botoes', { duration: 3000 });
  sr.reveal('.home_patrocinadores', { duration: 3000 });

  //screening
  sr.reveal('.form-group', { duration: 3000 });

  //mitos
  sr.reveal('.mit_header1', { duration: 2000 });
  sr.reveal('.mit_main, .mit_myth, .mit_title', { duration: 3000 });
  sr.reveal('.mit_final', { duration: 6000 });

  //suporte
  sr.reveal('.retangulo', { duration: 2000 });
  sr.reveal('.retangulo2', { duration: 5000 });
  sr.reveal('.retangulo-menor', { duration: 5300 });

  //chamados
  sr.reveal('.chamado-card', { duration: 1490 });
  sr.reveal('.futuro-container', { duration: 2000 });

  

  //beneficios
  sr.reveal('.apoia_container', { duration: 3000 });
  sr.reveal('.benef_topo', { duration: 3000 });
  sr.reveal('.benef_mitos', { duration: 3000 });
  sr.reveal('.benef_centralizar', { duration: 3000 });
  
  
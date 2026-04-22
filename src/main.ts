import { onRouteChange } from './router';
import { renderHome } from './routes/home';
import { renderQuiz } from './routes/quiz';
import { renderResult } from './routes/result';
import { mount } from './dom/h';

const app = document.getElementById('app') as HTMLElement;

onRouteChange((route) => {
  switch (route.kind) {
    case 'home':    mount(app, renderHome()); break;
    case 'quiz':    mount(app, renderQuiz()); break;
    case 'result':  mount(app, renderResult(route.payload)); break;
    case 'notfound': mount(app, renderHome()); break;
  }
});

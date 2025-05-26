import { Routes } from '@angular/router';
import { AnonymousGuard } from '../guards/anonymous-guard.service';
import { IsAdminGuard } from '../guards/is-admin-guard.service';
import { LoginComponent } from './pages/admin/auth/login/login.component';
import { HomeComponent as AdminHomeComponent } from './pages/admin/home/home.component';
import { CreatePostComponent } from './pages/admin/posts/create-post/create-post.component';
import { ListPostsComponent as AdminListPostsComponent } from './pages/admin/posts/list-posts/list-posts.component';
import { CreateSingerComponent } from './pages/admin/singers/create-singer/create-singer.component';
import { ListSingersComponent } from './pages/admin/singers/list-singers/list-singers.component';
import { GetPostComponent } from './pages/admin/posts/get-post/get-post.component';
import { UpdateSingerComponent } from './pages/admin/singers/update-singer/update-singer.component';
import { UpdatePostComponent } from './pages/admin/posts/update-post/update-post.component';
import { HomeComponent } from './pages/home/home.component';
import { SearchResultsComponent } from './pages/search/search-results/search-results.component';

const adminRoutes: Routes = [
  {
    path: 'admin/auth/login',
    component: LoginComponent,
    canActivate: [AnonymousGuard],
  },
  {
    path: 'admin',
    canActivate: [IsAdminGuard],
    // canActivateChild: [IsAdminGuard],
    children: [
      {
        path: 'rawadeed',
        component: ListSingersComponent,
      },
      {
        path: 'rawadeed/create',
        component: CreateSingerComponent,
      },
      {
        path: 'rawadeed/:id/edit',
        component: UpdateSingerComponent,
      },
      {
        path: 'latmeyyat',
        component: AdminListPostsComponent,
      },
      {
        path: 'latmeyyat/create',
        component: CreatePostComponent,
      },
      {
        path: 'latmeyyat/:id',
        component: GetPostComponent,
      },
      {
        path: 'latmeyyat/:id/edit',
        component: UpdatePostComponent,
      },
      {
        path: 'home',
        component: AdminHomeComponent,
      },
    ],
  },
];

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'search',
    component: SearchResultsComponent,
  },
  ...adminRoutes,
];

// // In the main application:
// export const ROUTES: Route[] = [
//   {path: 'admin', loadChildren: () => import('./admin/routes').then(mod => mod.ADMIN_ROUTES)},
//   // ...
// ];

// // In admin/routes.ts:
// export const ADMIN_ROUTES: Route[] = [
//   {path: 'home', component: AdminHomeComponent},
//   {path: 'users', component: AdminUsersComponent},
//   // ...
// ];

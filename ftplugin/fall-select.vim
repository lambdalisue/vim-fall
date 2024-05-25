if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

" Buffer local options
setlocal bufhidden=wipe buftype=nofile nobuflisted noswapfile

" Window local options
setlocal signcolumn=yes nofoldenable nowrap
setlocal nonumber norelativenumber

if exists('g:loaded_fall_mapping')
  finish
endif
let g:loaded_fall_mapping = 1

function! s:dispatch(name, ...) abort
  const l:args = a:0 ? [a:name, a:1] : [a:name]
  call denops#notify('fall', 'dispatch', l:args)
endfunction

cnoremap <silent> <Plug>(fall-select) <Cmd>call <SID>dispatch('selector-select')<CR>
cnoremap <silent> <Plug>(fall-select-all) <Cmd>call <SID>dispatch('selector-select-all')<CR>
cnoremap <silent> <Plug>(fall-cursor-first) <Cmd>call <SID>dispatch('selector-cursor-move-at', 1)<CR>
cnoremap <silent> <Plug>(fall-cursor-last) <Cmd>call <SID>dispatch('selector-cursor-move-at', '$')<CR>
cnoremap <silent> <Plug>(fall-cursor-next) <Cmd>call <SID>dispatch('selector-cursor-move', 1)<CR>
cnoremap <silent> <Plug>(fall-cursor-prev) <Cmd>call <SID>dispatch('selector-cursor-move', -1)<CR>
cnoremap <silent> <Plug>(fall-preview-first) <Cmd>call <SID>dispatch('preview-cursor-move-at', 1)<CR>
cnoremap <silent> <Plug>(fall-preview-last) <Cmd>call <SID>dispatch('preview-cursor-move-at', '$')<CR>
cnoremap <silent> <Plug>(fall-preview-next) <Cmd>call <SID>dispatch('preview-cursor-move', 1)<CR>
cnoremap <silent> <Plug>(fall-preview-prev) <Cmd>call <SID>dispatch('preview-cursor-move', -1)<CR>
cnoremap <silent> <Plug>(fall-action-select) <Cmd>call <SID>dispatch('action-invoke', '@select')<CR>
cnoremap <silent> <Plug>(fall-action-default) <Cmd>call <SID>dispatch('action-invoke', '@default')<CR>

function! s:map_source_picker() abort
  cnoremap <nowait><buffer> <C-t> <Plug>(fall-cursor-first)
  cnoremap <nowait><buffer> <Home> <Plug>(fall-cursor-first)
  cnoremap <nowait><buffer> <C-g> <Plug>(fall-cursor-last)
  cnoremap <nowait><buffer> <End> <Plug>(fall-cursor-last)
  cnoremap <nowait><buffer> <C-n> <Plug>(fall-cursor-next)
  cnoremap <nowait><buffer> <Down> <Plug>(fall-cursor-next)
  cnoremap <nowait><buffer> <C-p> <Plug>(fall-cursor-prev)
  cnoremap <nowait><buffer> <Up> <Plug>(fall-cursor-prev)
  cnoremap <nowait><buffer> <C-d> <Plug>(fall-preview-next)
  cnoremap <nowait><buffer> <PageDown> <Plug>(fall-preview-next)
  cnoremap <nowait><buffer> <C-u> <Plug>(fall-preview-prev)
  cnoremap <nowait><buffer> <PageUp> <Plug>(fall-preview-prev)
  cnoremap <nowait><buffer> <C-,> <Plug>(fall-select)
  cnoremap <nowait><buffer> <C-.> <Plug>(fall-select-all)
  cnoremap <nowait><buffer> <C-j> <Plug>(fall-select)<Plug>(fall-cursor-next)
  cnoremap <nowait><buffer> <C-k> <Plug>(fall-cursor-prev)<Plug>(fall-select)
  cnoremap <nowait><buffer> <Tab> <Plug>(fall-action-select)
  cnoremap <nowait><buffer> <Return> <Plug>(fall-action-default)
endfunction

function! s:unmap_source_picker() abort
  silent cunmap <buffer> <C-t>
  silent cunmap <buffer> <Home>
  silent cunmap <buffer> <C-g>
  silent cunmap <buffer> <End>
  silent cunmap <buffer> <C-n>
  silent cunmap <buffer> <Down>
  silent cunmap <buffer> <C-p>
  silent cunmap <buffer> <Up>
  silent cunmap <buffer> <C-d>
  silent cunmap <buffer> <C-u>
  silent cunmap <buffer> <C-,>
  silent cunmap <buffer> <C-.>
  silent cunmap <buffer> <C-j>
  silent cunmap <buffer> <C-k>
  silent cunmap <buffer> <Tab>
  silent cunmap <buffer> <Return>
endfunction

function! s:map_action_picker() abort
  cnoremap <nowait><buffer> <C-t> <Plug>(fall-cursor-first)
  cnoremap <nowait><buffer> <Home> <Plug>(fall-cursor-first)
  cnoremap <nowait><buffer> <C-g> <Plug>(fall-cursor-last)
  cnoremap <nowait><buffer> <End> <Plug>(fall-cursor-last)
  cnoremap <nowait><buffer> <C-n> <Plug>(fall-cursor-next)
  cnoremap <nowait><buffer> <Down> <Plug>(fall-cursor-next)
  cnoremap <nowait><buffer> <C-p> <Plug>(fall-cursor-prev)
  cnoremap <nowait><buffer> <Up> <Plug>(fall-cursor-prev)
endfunction

function! s:unmap_action_picker() abort
  silent! cunmap <buffer> <C-t>
  silent! cunmap <buffer> <Home>
  silent! cunmap <buffer> <C-g>
  silent! cunmap <buffer> <End>
  silent! cunmap <buffer> <C-n>
  silent! cunmap <buffer> <Down>
  silent! cunmap <buffer> <C-p>
  silent! cunmap <buffer> <Up>
endfunction

if !get(g:, 'fall_disable_default_mapping')
  augroup fall_mapping_plugin
    autocmd!
    autocmd User FallPickerEnter:source:* call s:map_source_picker()
    autocmd User FallPickerLeave:source:* call s:unmap_source_picker()
    autocmd User FallPickerEnter:action call s:map_action_picker()
    autocmd User FallPickerLeave:action call s:unmap_action_picker()
  augroup END
endif

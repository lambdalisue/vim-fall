if exists('g:loaded_fall')
  finish
endif
let g:loaded_fall = 1

command! -nargs=* Fall call denops#notify('fall', 'startCommand', [[<f-args>]])

cnoremap <silent> <Plug>(fall-select) <Cmd>call denops#notify('fall', 'select', [])<CR>
cnoremap <silent> <Plug>(fall-sorter-next) <Cmd>call denops#notify('fall', 'sorterNext', [])<CR>
cnoremap <silent> <Plug>(fall-sorter-prev) <Cmd>call denops#notify('fall', 'sorterPrevious', [])<CR>
cnoremap <silent> <Plug>(fall-cursor-next) <Cmd>call denops#notify('fall', 'cursorNext', [])<CR>
cnoremap <silent> <Plug>(fall-cursor-prev) <Cmd>call denops#notify('fall', 'cursorPrevious', [])<CR>
cnoremap <silent> <Plug>(fall-preview-next) <Cmd>call denops#notify('fall', 'previewNext', [])<CR>
cnoremap <silent> <Plug>(fall-preview-prev) <Cmd>call denops#notify('fall', 'previewPrevious', [])<CR>
cnoremap <silent> <Plug>(fall-action-select) <Cmd>call denops#request('fall', 'actionSelect', [])<CR><CR>
cnoremap <silent> <Plug>(fall-action-default) <Cmd>call denops#request('fall', 'actionDefault', [])<CR><CR>

function! s:map_items_picker() abort
  cnoremap <nowait><buffer> <C-g> <Plug>(fall-sorter-next)
  cnoremap <nowait><buffer> <C-t> <Plug>(fall-sorter-prev)
  cnoremap <nowait><buffer> <C-n> <Plug>(fall-cursor-next)
  cnoremap <nowait><buffer> <C-p> <Plug>(fall-cursor-prev)
  cnoremap <nowait><buffer> <C-d> <Plug>(fall-preview-next)
  cnoremap <nowait><buffer> <C-u> <Plug>(fall-preview-prev)
  cnoremap <nowait><buffer> <C-j> <Plug>(fall-select)<Plug>(fall-cursor-next)
  cnoremap <nowait><buffer> <C-k> <Plug>(fall-cursor-prev)<Plug>(fall-select)
  cnoremap <nowait><buffer> <C-i> <Plug>(fall-action-select)
  cnoremap <nowait><buffer> <Return> <Plug>(fall-action-default)
endfunction

function! s:unmap_items_picker() abort
  cunmap <buffer> <C-g>
  cunmap <buffer> <C-t>
  cunmap <buffer> <C-n>
  cunmap <buffer> <C-p>
  cunmap <buffer> <C-d>
  cunmap <buffer> <C-u>
  cunmap <buffer> <C-j>
  cunmap <buffer> <C-k>
  cunmap <buffer> <C-i>
  cunmap <buffer> <Return>
endfunction

function! s:map_action_picker() abort
  cnoremap <nowait><buffer> <C-g> <Plug>(fall-sorter-next)
  cnoremap <nowait><buffer> <C-t> <Plug>(fall-sorter-prev)
  cnoremap <nowait><buffer> <C-n> <Plug>(fall-cursor-next)
  cnoremap <nowait><buffer> <C-p> <Plug>(fall-cursor-prev)
endfunction

function! s:unmap_action_picker() abort
  cunmap <buffer> <C-g>
  cunmap <buffer> <C-t>
  cunmap <buffer> <C-n>
  cunmap <buffer> <C-p>
endfunction

augroup fall_plugin
  autocmd!
  autocmd FileReadCmd fall://preview-blank setlocal filetype=fall-preview-blank
  autocmd User FallPickerEnter:items call s:map_items_picker()
  autocmd User FallPickerLeave:items call s:unmap_items_picker()
  autocmd User FallPickerEnter:action call s:map_action_picker()
  autocmd User FallPickerLeave:action call s:unmap_action_picker()
augroup END
